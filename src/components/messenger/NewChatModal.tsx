import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, AtSign, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  name: string;
  phone: string;
  username: string | null;
  avatar_url: string | null;
  status: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (userId: string) => void;
}

type SearchMode = "username" | "phone";

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChat }) => {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("username");
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    let query = supabase.from("profiles").select("*").neq("id", user?.id || "");
    
    if (searchMode === "username") {
      // Search by exact username match (case-insensitive)
      query = query.ilike("username", search.trim());
    } else {
      // Search by phone - clean up input and search
      const cleanPhone = search.trim().replace(/[\s\-\(\)]/g, "");
      query = query.eq("phone", cleanPhone);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (!error && data) {
      setFoundUser(data);
    } else {
      setFoundUser(null);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClose = () => {
    setSearch("");
    setFoundUser(null);
    setSearched(false);
    onClose();
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearch("");
    setFoundUser(null);
    setSearched(false);
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
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-card border border-border rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <motion.h2 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="font-display text-lg tracking-wider text-foreground"
              >
                Новый чат
              </motion.h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
              >
                <X size={20} className="text-muted-foreground" />
              </motion.button>
            </div>

            {/* Mode Tabs */}
            <div className="px-4 pt-4">
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeChange("username")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    searchMode === "username"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AtSign size={16} />
                  Username
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeChange("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    searchMode === "phone"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone size={16} />
                  Телефон
                </motion.button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4">
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="relative flex gap-2"
              >
                <div className="relative flex-1">
                  {searchMode === "username" ? (
                    <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  ) : (
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchMode === "username" ? "Введите username..." : "+7XXXXXXXXXX"}
                    className="w-full h-12 pl-11 pr-4 bg-input border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein focus:ring-2 focus:ring-marble-vein/20 transition-all duration-300"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  disabled={loading || !search.trim()}
                  className="h-12 px-4 bg-foreground text-background rounded-2xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <Search size={18} />
                </motion.button>
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2 pl-1">
                {searchMode === "username" 
                  ? "Поиск по точному совпадению username"
                  : "Введите номер телефона в формате +7XXXXXXXXXX"
                }
              </p>
            </div>

            {/* Result */}
            <div className="min-h-[120px] pb-4">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                </div>
              ) : searched && !foundUser ? (
                <div className="p-8 text-center">
                  <UserPlus size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Пользователь не найден
                  </p>
                </div>
              ) : foundUser ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 4, backgroundColor: "hsl(var(--secondary))" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCreateChat(foundUser.id)}
                  className="flex items-center gap-3 p-4 mx-2 cursor-pointer transition-all duration-300 rounded-2xl"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-foreground font-display text-lg overflow-hidden shadow-sm"
                  >
                    {foundUser.avatar_url ? (
                      <img src={foundUser.avatar_url} alt={foundUser.name} className="w-full h-full object-cover" />
                    ) : (
                      foundUser.name.charAt(0).toUpperCase()
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{foundUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {foundUser.username ? `@${foundUser.username}` : foundUser.phone}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center">
                  {searchMode === "username" ? (
                    <AtSign size={32} className="text-muted-foreground/50 mx-auto mb-2" />
                  ) : (
                    <Phone size={32} className="text-muted-foreground/50 mx-auto mb-2" />
                  )}
                  <p className="text-muted-foreground/70 text-sm">
                    {searchMode === "username" 
                      ? "Введите username для поиска"
                      : "Введите номер телефона для поиска"
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewChatModal;
