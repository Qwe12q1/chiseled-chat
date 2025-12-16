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
    const { messageId, messageContent, reporterId, reportedUserId, chatId, reason } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log("Moderating message:", messageId);

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
            content: `Ты модератор контента. Проанализируй сообщение и определи, нарушает ли оно правила.
Правила:
1. Запрещены оскорбления, угрозы, дискриминация
2. Запрещен спам и мошенничество
3. Запрещен контент для взрослых
4. Запрещена реклама без согласия

Ответь в формате JSON:
{
  "verdict": "block" или "warn" или "safe",
  "confidence": число от 0 до 1,
  "reason": "краткое объяснение"
}`
          },
          {
            role: "user",
            content: `Сообщение: "${messageContent}"\n\nПричина жалобы от пользователя: ${reason || "не указана"}`
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

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        status: verdict.verdict === "block" ? "auto_blocked" : "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      throw reportError;
    }

    // If verdict is "block", block the user
    if (verdict.verdict === "block" && verdict.confidence >= 0.7) {
      console.log("Blocking user:", reportedUserId);

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
        blocked: verdict.verdict === "block" && verdict.confidence >= 0.7,
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
