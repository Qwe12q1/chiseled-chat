import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const EmptyChat: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <MessageSquare size={40} className="text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl text-foreground mb-2 tracking-wider">
          MAX Core
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Выберите чат из списка слева или начните новый разговор
        </p>
      </motion.div>

      {/* Decorative marble elements */}
      <div className="absolute inset-0 marble-texture opacity-10 pointer-events-none" />
      <div className="absolute inset-0 marble-veins pointer-events-none" />
    </div>
  );
};

export default EmptyChat;
