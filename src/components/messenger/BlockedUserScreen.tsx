import React from "react";
import { motion } from "framer-motion";
import { Ban, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BlockedUserScreenProps {
  reason?: string;
}

const BlockedUserScreen: React.FC<BlockedUserScreenProps> = ({ reason }) => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto w-24 h-24 rounded-full bg-destructive/15 flex items-center justify-center mb-8"
        >
          <Ban className="w-12 h-12 text-destructive" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-2xl tracking-wider text-foreground mb-4"
        >
          Мы заметили нарушение правил
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-6"
        >
          Ваш аккаунт был заблокирован за нарушение правил сообщества.
        </motion.p>

        {/* Reason card */}
        {reason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-secondary/50 border border-border rounded-2xl p-4 mb-8"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground mb-1">Причина блокировки:</p>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground mb-8"
        >
          Если вы считаете, что это ошибка, пожалуйста, свяжитесь с поддержкой.
        </motion.p>

        {/* Logout button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-secondary text-foreground rounded-2xl hover:bg-secondary/80 transition-colors"
        >
          <LogOut size={18} />
          Выйти из аккаунта
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BlockedUserScreen;
