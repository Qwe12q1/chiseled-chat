import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Bell, Lock, HelpCircle, LogOut, ChevronRight, Crown, User, AtSign, Phone, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SubscriptionPanel from "./SubscriptionPanel";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Profile {
  name: string;
  phone: string;
  username: string | null;
  avatar_url: string | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, remainingMessages } = useSubscription();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("name, phone, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
      setEditName(data.name);
      setEditUsername(data.username || "");
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);

    // Check if username is taken (if changed)
    if (editUsername && editUsername !== profile.username) {
      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", editUsername)
        .neq("id", user.id)
        .maybeSingle();
        
      if (existingUsername) {
        toast({
          title: "Username занят",
          description: "Этот username уже используется",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editName.trim() || profile.name,
        username: editUsername.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Сохранено",
        description: "Профиль обновлён",
      });
      setProfile(prev => prev ? {
        ...prev,
        name: editName.trim() || prev.name,
        username: editUsername.trim() || null,
      } : null);
      setShowProfile(false);
    }
    setSaving(false);
  };

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
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 overflow-hidden rounded-l-3xl"
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
                className="p-2 rounded-xl hover:bg-secondary transition-colors duration-300"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            {/* Profile section */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowProfile(true)}
              className="w-full mx-0 p-4 border-b border-border hover:bg-secondary/50 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-foreground font-display text-lg">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    profile?.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{profile?.name || "Загрузка..."}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.username ? `@${profile.username}` : "Добавить username"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </motion.button>

            {/* Subscription banner */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => setShowSubscription(true)}
              className={`mx-4 mt-4 p-4 rounded-2xl border transition-all duration-300 w-[calc(100%-2rem)] ${
                isSubscribed
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-secondary border-border hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Crown className={isSubscribed ? "text-amber-500" : "text-muted-foreground"} size={24} />
                <div className="flex-1 text-left">
                  <p className={`font-medium ${isSubscribed ? "text-amber-500" : "text-foreground"}`}>
                    {isSubscribed ? "Premium активен" : "Получить Premium"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed
                      ? "Безлимитные сообщения"
                      : `Осталось ${remainingMessages} сообщений сегодня`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </motion.button>

            {/* Settings list */}
            <div className="p-4 space-y-2">
              {settingsItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary transition-colors duration-300"
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
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-300"
              >
                <LogOut size={20} />
                <span className="tracking-wider text-sm">Выйти</span>
              </motion.button>
            </div>

            {/* Version */}
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground/50 tracking-wider">
                MAX Core v1.0
              </p>
            </div>
          </motion.div>

          {/* Profile Edit Panel */}
          <AnimatePresence>
            {showProfile && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowProfile(false)}
                  className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-[60] overflow-hidden rounded-l-3xl"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-display text-lg tracking-wider text-foreground">
                      Профиль
                    </h2>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors duration-300"
                      >
                        <Check size={20} className="text-foreground" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowProfile(false)}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors duration-300"
                      >
                        <X size={20} className="text-muted-foreground" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Profile form */}
                  <div className="p-4 space-y-4">
                    {/* Avatar */}
                    <div className="flex justify-center mb-6">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-foreground font-display text-3xl">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-3xl" />
                        ) : (
                          profile?.name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                    </div>

                    {/* Name field */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <User size={14} />
                        Имя
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full h-12 px-4 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein focus:ring-2 focus:ring-marble-vein/20 transition-all duration-300"
                      />
                    </div>

                    {/* Username field */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <AtSign size={14} />
                        Username
                      </label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="Добавить username"
                        className="w-full h-12 px-4 bg-input border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein focus:ring-2 focus:ring-marble-vein/20 transition-all duration-300"
                      />
                      <p className="text-xs text-muted-foreground">
                        Только латиница, цифры и _
                      </p>
                    </div>

                    {/* Phone field (read-only) */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Phone size={14} />
                        Телефон
                      </label>
                      <input
                        type="text"
                        value={profile?.phone || ""}
                        readOnly
                        disabled
                        className="w-full h-12 px-4 bg-muted border border-border rounded-2xl text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground/70">
                        Номер телефона нельзя изменить
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <SubscriptionPanel
            isOpen={showSubscription}
            onClose={() => setShowSubscription(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
