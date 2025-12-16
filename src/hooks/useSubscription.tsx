import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type SubscriptionPlan = "free" | "month_1" | "month_6" | "month_12";

interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  started_at: string | null;
  expires_at: string | null;
}

const DAILY_MESSAGE_LIMIT = 5;

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("subscriptions" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSubscription(data as unknown as Subscription);
    }
  };

  const fetchDailyMessageCount = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    const { data } = await supabase
      .from("daily_message_counts" as any)
      .select("count")
      .eq("user_id", user.id)
      .eq("message_date", today)
      .maybeSingle();

    if (data) {
      setDailyMessageCount((data as any).count);
    } else {
      setDailyMessageCount(0);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscription(), fetchDailyMessageCount()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const isSubscribed = () => {
    if (!subscription) return false;
    if (subscription.plan === "free") return false;
    if (!subscription.expires_at) return false;
    return new Date(subscription.expires_at) > new Date();
  };

  const canSendMessage = () => {
    if (isSubscribed()) return true;
    return dailyMessageCount < DAILY_MESSAGE_LIMIT;
  };

  const getRemainingMessages = () => {
    if (isSubscribed()) return Infinity;
    return Math.max(0, DAILY_MESSAGE_LIMIT - dailyMessageCount);
  };

  const incrementMessageCount = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    // Try to update existing record
    const { data: existing } = await supabase
      .from("daily_message_counts" as any)
      .select("id, count")
      .eq("user_id", user.id)
      .eq("message_date", today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("daily_message_counts" as any)
        .update({ count: (existing as any).count + 1 })
        .eq("id", (existing as any).id);
      setDailyMessageCount((existing as any).count + 1);
    } else {
      await supabase
        .from("daily_message_counts" as any)
        .insert({
          user_id: user.id,
          message_date: today,
          count: 1,
        });
      setDailyMessageCount(1);
    }
  };

  const activateSubscription = async (plan: SubscriptionPlan) => {
    if (!user) return false;

    const months = plan === "month_1" ? 1 : plan === "month_6" ? 6 : 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Check if subscription exists
    const { data: existing } = await supabase
      .from("subscriptions" as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("subscriptions" as any)
        .update({
          plan,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      if (!error) {
        await fetchSubscription();
        return true;
      }
    } else {
      const { error } = await supabase
        .from("subscriptions" as any)
        .insert({
          user_id: user.id,
          plan,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (!error) {
        await fetchSubscription();
        return true;
      }
    }

    return false;
  };

  const getPlanLabel = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "month_1": return "1 месяц";
      case "month_6": return "6 месяцев";
      case "month_12": return "12 месяцев";
      default: return "Бесплатный";
    }
  };

  return {
    subscription,
    loading,
    isSubscribed: isSubscribed(),
    canSendMessage: canSendMessage(),
    remainingMessages: getRemainingMessages(),
    dailyMessageCount,
    incrementMessageCount,
    activateSubscription,
    getPlanLabel,
    refreshSubscription: fetchSubscription,
  };
};
