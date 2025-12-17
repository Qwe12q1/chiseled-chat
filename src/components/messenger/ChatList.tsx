import React from "react";
import { motion } from "framer-motion";
import { Search, Plus, Settings, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar?: string;
  online?: boolean;
  isOtherUserBlocked?: boolean;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSettings: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  onSettings,
}) => {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-display text-xl tracking-wider text-foreground"
          >
            MAX Core
          </motion.h1>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--secondary))" }}
              whileTap={{ scale: 0.9 }}
              onClick={onNewChat}
              className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
            >
              <Plus size={20} className="text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--secondary))" }}
              whileTap={{ scale: 0.9 }}
              onClick={onSettings}
              className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
            >
              <Settings size={20} className="text-muted-foreground" />
            </motion.button>
          </div>
        </div>
        
        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full h-11 pl-11 pr-4 bg-input border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein focus:ring-2 focus:ring-marble-vein/20 transition-all duration-300"
          />
        </motion.div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center justify-center h-full p-4 text-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center mb-4 shadow-lg"
            >
              <Plus size={28} className="text-muted-foreground" />
            </motion.div>
            <p className="text-muted-foreground text-sm mb-3">Нет чатов</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewChat}
              className="px-4 py-2 bg-foreground text-primary-foreground rounded-xl text-xs tracking-wider hover:bg-marble-vein transition-all duration-300"
            >
              Начать новый чат
            </motion.button>
          </motion.div>
        ) : (
          chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.06, 
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
              whileHover={{ 
                scale: 1.02, 
                x: 4,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-all duration-300 rounded-2xl mb-1",
                selectedChatId === chat.id
                  ? "bg-secondary shadow-md"
                  : "hover:bg-secondary/60"
              )}
            >
              {/* Avatar */}
              <div className="relative">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-13 h-13 rounded-2xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-foreground font-display text-lg overflow-hidden shadow-sm"
                  style={{ width: 52, height: 52 }}
                >
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  ) : (
                    chat.name.charAt(0).toUpperCase()
                  )}
                </motion.div>
                {chat.online && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card shadow-sm" 
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-foreground truncate">{chat.name}</span>
                    {chat.isOtherUserBlocked && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-destructive/15 rounded-lg text-[10px] text-destructive flex-shrink-0 font-medium">
                        <Ban size={10} />
                        Бан
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-foreground text-primary-foreground text-xs flex items-center justify-center font-medium shadow-sm"
                    >
                      {chat.unread}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
