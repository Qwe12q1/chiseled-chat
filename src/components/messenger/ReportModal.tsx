import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  reportedUserId,
  chatId,
  reporterId,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const portalRootRef = useRef<HTMLDivElement | null>(null);
  const restoreRootStylesRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    setMounted(true);

    // Create a dedicated portal root so layout/styling is fully controlled.
    const root = document.createElement("div");
    root.setAttribute("data-report-modal-root", "");
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "9999";
    root.style.pointerEvents = "auto";
    root.style.transform = "none";

    document.body.appendChild(root);
    portalRootRef.current = root;

    return () => {
      root.remove();
      portalRootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Hard guarantee: if html/body are transformed/scaled, fixed centering can drift.
    // We temporarily neutralize these while the modal is open.
    if (!isOpen) {
      restoreRootStylesRef.current?.();
      restoreRootStylesRef.current = null;
      return;
    }

    const html = document.documentElement;
    const body = document.body;

    const prev = {
      htmlTransform: html.style.transform,
      bodyTransform: body.style.transform,
      // `zoom` is non-standard but can exist in some setups.
      htmlZoom: (html.style as any).zoom as string | undefined,
      bodyZoom: (body.style as any).zoom as string | undefined,
    };

    html.style.transform = "none";
    body.style.transform = "none";
    (html.style as any).zoom = "1";
    (body.style as any).zoom = "1";

    restoreRootStylesRef.current = () => {
      html.style.transform = prev.htmlTransform;
      body.style.transform = prev.bodyTransform;
      (html.style as any).zoom = prev.htmlZoom ?? "";
      (body.style as any).zoom = prev.bodyZoom ?? "";
    };

    return () => {
      restoreRootStylesRef.current?.();
      restoreRootStylesRef.current = null;
    };
  }, [isOpen, mounted]);

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

  if (!mounted) return null;
  if (!portalRootRef.current) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          // Fullscreen wrapper controlled entirely here (no translate centering).
          className="fixed inset-0 z-[9999]"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            pointerEvents: "auto",
            transform: "none",
          }}
        >
          <motion.button
            type="button"
            aria-label="Закрыть окно жалобы"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            style={{ transform: "none" }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Пожаловаться"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-md max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ transform: "none" }}
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
                aria-label="Закрыть"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
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
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    portalRootRef.current
  );
};

export default ReportModal;
