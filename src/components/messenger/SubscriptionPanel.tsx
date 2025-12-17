import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Sparkles, Shield, Zap, MessageCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

interface SubscriptionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: "month_1" as const,
    name: "1 месяц",
    price: "299 ₽",
    pricePerMonth: "299 ₽/мес",
    popular: false,
  },
  {
    id: "month_6" as const,
    name: "6 месяцев",
    price: "1 499 ₽",
    pricePerMonth: "250 ₽/мес",
    popular: true,
    discount: "-17%",
  },
  {
    id: "month_12" as const,
    name: "12 месяцев",
    price: "2 399 ₽",
    pricePerMonth: "200 ₽/мес",
    popular: false,
    discount: "-33%",
  },
];

const features = [
  { icon: MessageCircle, text: "Безлимитные сообщения" },
  { icon: Zap, text: "Приоритетная доставка" },
  { icon: Shield, text: "Расширенная конфиденциальность" },
  { icon: Sparkles, text: "Эксклюзивные темы оформления" },
  { icon: Crown, text: "Премиум поддержка 24/7" },
];

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({ isOpen, onClose }) => {
  const { subscription, isSubscribed, activateSubscription, getPlanLabel } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0]["id"]>("month_6");
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async () => {
    setProcessing(true);
    const success = await activateSubscription(selectedPlan);
    setProcessing(false);

    if (success) {
      toast.success("Подписка успешно активирована!");
      onClose();
    } else {
      toast.error("Ошибка при активации подписки");
    }
  };

  const formatExpiry = () => {
    if (!subscription?.expires_at) return "";
    return new Intl.DateTimeFormat("ru", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(subscription.expires_at));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto rounded-l-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Crown className="text-amber-500" size={24} />
                <h2 className="font-display text-lg tracking-wider text-foreground">
                  MAX Core Premium
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-secondary transition-colors duration-300"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            <div className="p-4 space-y-6">
              {/* Current status */}
              {isSubscribed && subscription && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="text-amber-500" size={18} />
                    <span className="text-amber-500 font-medium">Премиум активен</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Тариф: {getPlanLabel(subscription.plan as any)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Активен до: {formatExpiry()}
                  </p>
                </motion.div>
              )}

              {/* Features */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                  Преимущества Premium
                </h3>
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50"
                  >
                    <feature.icon size={20} className="text-amber-500 flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Free tier info */}
              {!isSubscribed && (
                <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-destructive font-medium">Бесплатный тариф:</span>{" "}
                    5 сообщений в день
                  </p>
                </div>
              )}

              {/* Plans */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                  Выберите тариф
                </h3>
                {plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-2xl border transition-all duration-300 relative ${
                      selectedPlan === plan.id
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 right-4 px-2 py-0.5 bg-amber-500 text-primary-foreground text-xs rounded-xl">
                        Популярный
                      </span>
                    )}
                    {plan.discount && (
                      <span className="absolute -top-2 left-4 px-2 py-0.5 bg-green-500 text-primary-foreground text-xs rounded-xl">
                        {plan.discount}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-medium text-foreground">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.pricePerMonth}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-display text-foreground">{plan.price}</span>
                        {selectedPlan === plan.id && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check size={14} className="text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Subscribe button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubscribe}
                disabled={processing}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-primary-foreground font-medium tracking-wider hover:from-amber-600 hover:to-amber-700 transition-all duration-300 disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Обработка...
                  </span>
                ) : isSubscribed ? (
                  "Продлить подписку"
                ) : (
                  "Оформить подписку"
                )}
              </motion.button>

              <p className="text-xs text-center text-muted-foreground">
                Подписка активируется мгновенно. Оплата безопасна.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionPanel;
