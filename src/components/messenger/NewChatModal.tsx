import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  status: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (userId: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user?.id || "");
    
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-card border border-border rounded-sm shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-lg tracking-wider text-foreground">
                Новый чат
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

            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по имени или телефону..."
                  className="w-full h-10 pl-10 pr-4 bg-input border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein transition-colors duration-300"
                />
              </div>
            </div>

            {/* Users list */}
            <div className="max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <UserPlus size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {search ? "Пользователи не найдены" : "Нет доступных пользователей"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((profile) => (
                  <motion.div
                    key={profile.id}
                    whileHover={{ backgroundColor: "hsl(var(--secondary))" }}
                    onClick={() => onCreateChat(profile.id)}
                    className="flex items-center gap-3 p-4 cursor-pointer transition-colors duration-300 border-b border-border/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-display text-lg">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        profile.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewChatModal;
