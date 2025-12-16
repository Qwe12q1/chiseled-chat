import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Bell, Lock, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const settingsItems = [
    { icon: Moon, label: "Тема", value: "Тёмная" },
    { icon: Bell, label: "Уведомления", value: "Включены" },
    { icon: Lock, label: "Конфиденциальность", value: "" },
    { icon: HelpCircle, label: "Помощь", value: "" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-lg tracking-wider text-foreground">
                Настройки
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            {/* Settings list */}
            <div className="p-4 space-y-2">
              {settingsItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full flex items-center gap-4 p-4 rounded-sm hover:bg-secondary transition-colors duration-300"
                >
                  <item.icon size={20} className="text-muted-foreground" />
                  <span className="flex-1 text-left text-foreground">{item.label}</span>
                  {item.value && (
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground" />
                </motion.button>
              ))}
            </div>

            {/* Logout button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-300"
              >
                <LogOut size={20} />
                <span className="tracking-wider text-sm">Выйти</span>
              </motion.button>
            </div>

            {/* Version */}
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground/50 tracking-wider">
                NOIR Messenger v1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
