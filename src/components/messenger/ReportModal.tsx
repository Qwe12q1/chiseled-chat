import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  reportedUserId: string;
  chatId: string;
  reporterId: string;
}

const reportReasons = [
  "Оскорбления и грубость",
  "Угрозы и запугивание",
  "Спам или мошенничество",
  "Неприемлемый контент",
  "Другое",
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  messageId,
  messageContent,
  reportedUserId,
  chatId,
  reporterId,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Выберите причину жалобы");
      return;
    }

    setIsSubmitting(true);

    try {
      const reason = selectedReason === "Другое" ? customReason : selectedReason;

      const { data, error } = await supabase.functions.invoke("moderate-message", {
        body: {
          messageId,
          messageContent,
          reporterId,
          reportedUserId,
          chatId,
          reason,
        },
      });

      if (error) throw error;

      if (data.blocked) {
        toast.success("Пользователь заблокирован", {
          description: "AI-модерация подтвердила нарушение правил",
        });
      } else if (data.verdict === "warn") {
        toast.success("Жалоба отправлена", {
          description: "Сообщение будет проверено модератором",
        });
      } else {
        toast.info("Жалоба отправлена на рассмотрение");
      }

      onClose();
    } catch (error) {
      console.error("Report error:", error);
      toast.error("Ошибка отправки жалобы");
    } finally {
      setIsSubmitting(false);
    }
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" size={20} />
                <h2 className="font-display text-lg tracking-wider text-foreground">
                  Пожаловаться
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Message preview */}
              <div className="p-4 bg-secondary/50 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-1">Сообщение:</p>
                <p className="text-sm text-foreground line-clamp-3">{messageContent}</p>
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Причина жалобы:</p>
                {reportReasons.map((reason) => (
                  <motion.button
                    key={reason}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full p-4 rounded-2xl border text-left text-sm transition-all ${
                      selectedReason === reason
                        ? "border-destructive bg-destructive/5 text-foreground"
                        : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                    }`}
                  >
                    {reason}
                  </motion.button>
                ))}
              </div>

              {/* Custom reason input */}
              {selectedReason === "Другое" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Опишите причину..."
                    className="w-full h-20 p-4 bg-input border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-destructive"
                  />
                </motion.div>
              )}

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive text-primary-foreground font-medium tracking-wider hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Отправить жалобу
                  </>
                )}
              </motion.button>

              <p className="text-xs text-center text-muted-foreground">
                Жалоба будет проверена AI-модерацией
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
