import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    
    if (data) {
      setName(data.name || "");
      setPhone(data.phone || "");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone })
      .eq("id", user.id);
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить профиль",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Профиль обновлён",
      });
      onClose();
    }
    setLoading(false);
  };

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
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-card border-r border-border shadow-2xl z-50 overflow-hidden rounded-r-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-lg tracking-wider text-foreground">
                Профиль
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-secondary transition-colors duration-300"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center p-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-foreground font-display text-3xl">
                  {name.charAt(0).toUpperCase() || "?"}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-primary-foreground flex items-center justify-center"
                >
                  <Camera size={14} />
                </motion.button>
              </div>
              
              <p className="text-xs text-muted-foreground tracking-wider mb-8">
                {phone || "Телефон не указан"}
              </p>
            </div>

            {/* Form */}
            <div className="px-6 space-y-6">
              <div>
                <label className="block text-xs tracking-wider text-muted-foreground mb-2 uppercase">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 bg-input border border-border rounded-2xl text-foreground focus:outline-none focus:border-marble-vein transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-xs tracking-wider text-muted-foreground mb-2 uppercase">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-input border border-border rounded-2xl text-foreground focus:outline-none focus:border-marble-vein transition-colors duration-300"
                />
              </div>

              <LuxuryButton onClick={handleSave} isLoading={loading}>
                <Save size={16} />
                Сохранить
              </LuxuryButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfilePanel;
