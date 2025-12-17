import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reporterId, reportedUserId, chatId, reason } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log("Moderating user:", reportedUserId, "in chat:", chatId);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if reported user is already blocked
    const { data: blockedUser } = await supabase
      .from("blocked_users")
      .select("id")
      .eq("user_id", reportedUserId)
      .single();

    if (blockedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Пользователь уже заблокирован",
          alreadyBlocked: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get last 5 messages from the reported user in this chat
    const { data: recentMessages, error: messagesError } = await supabase
      .from("messages")
      .select("id, content, created_at")
      .eq("chat_id", chatId)
      .eq("sender_id", reportedUserId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (messagesError) {
      console.error("Error fetching recent messages:", messagesError);
    }

    if (!recentMessages || recentMessages.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Нет сообщений для модерации",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the most recent message ID for the report
    const messageId = recentMessages[0].id;

    const messagesContext = recentMessages
      .map((m, i) => `${i + 1}. "${m.content}"`)
      .join("\n");

    console.log("Messages context for moderation:", messagesContext);

    // Call OpenRouter for AI moderation
    const moderationResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: `Ты модератор контента. Проанализируй последние сообщения пользователя и определи, нарушает ли он правила.

Правила:
1. Запрещены оскорбления, угрозы, дискриминация
2. Запрещен спам и мошенничество
3. Запрещен контент для взрослых
4. Запрещена реклама без согласия

Важно: Оценивай ВСЕ предоставленные сообщения в совокупности, чтобы понять паттерн поведения.

Ответь в формате JSON:
{
  "verdict": "block" или "warn" или "safe",
  "confidence": число от 0 до 1,
  "reason": "краткое объяснение на русском"
}

- "block" - если есть явные серьёзные нарушения (угрозы, оскорбления, мошенничество)
- "warn" - если есть подозрительный контент, но недостаточно для блокировки
- "safe" - если нарушений не обнаружено`
          },
          {
            role: "user",
            content: `Последние сообщения пользователя, на которого поступила жалоба:\n${messagesContext}\n\nПричина жалобы от пользователя: ${reason || "не указана"}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!moderationResponse.ok) {
      const errorText = await moderationResponse.text();
      console.error("OpenRouter error:", moderationResponse.status, errorText);
      throw new Error(`OpenRouter error: ${moderationResponse.status}`);
    }

    const moderationData = await moderationResponse.json();
    const aiResponse = moderationData.choices?.[0]?.message?.content;
    
    console.log("AI response:", aiResponse);

    let verdict = { verdict: "safe", confidence: 0.5, reason: "Не удалось проанализировать" };
    try {
      verdict = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Determine if user should be blocked
    const shouldBlock = 
      (verdict.verdict === "block" && verdict.confidence >= 0.7) ||
      (verdict.verdict === "warn" && verdict.confidence >= 0.75);

    // Save report to database
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        message_id: messageId,
        chat_id: chatId,
        reason: reason,
        ai_verdict: verdict.verdict,
        ai_confidence: verdict.confidence,
        status: shouldBlock ? "auto_blocked" : "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      throw reportError;
    }

    // Block the user if criteria met
    if (shouldBlock) {
      console.log("Blocking user:", reportedUserId, "verdict:", verdict.verdict, "confidence:", verdict.confidence, "reason:", verdict.reason);

      // Add to blocked_users
      const { error: blockError } = await supabase
        .from("blocked_users")
        .upsert({
          user_id: reportedUserId,
          reason: verdict.reason,
          report_id: report.id,
        });

      if (blockError && !blockError.message.includes("duplicate")) {
        console.error("Error blocking user:", blockError);
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({ is_blocked: true })
        .eq("id", reportedUserId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        reason: verdict.reason,
        blocked: shouldBlock,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
