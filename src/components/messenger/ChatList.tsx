import React from "react";
import { motion } from "framer-motion";
import { Search, Plus, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar?: string;
  online?: boolean;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSettings: () => void;
  onProfile: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  onSettings,
  onProfile,
}) => {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl tracking-wider text-foreground">NOIR</h1>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewChat}
              className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
            >
              <Plus size={20} className="text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onProfile}
              className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
            >
              <User size={20} className="text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettings}
              className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
            >
              <Settings size={20} className="text-muted-foreground" />
            </motion.button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full h-10 pl-10 pr-4 bg-input border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein transition-colors duration-300"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Plus size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-2">Нет чатов</p>
            <button
              onClick={onNewChat}
              className="text-foreground text-xs tracking-wider hover:text-marble-vein transition-colors duration-300"
            >
              Начать новый чат
            </button>
          </div>
        ) : (
          chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                "flex items-center gap-3 p-4 cursor-pointer transition-all duration-300 border-b border-border/50",
                selectedChatId === chat.id
                  ? "bg-secondary"
                  : "hover:bg-secondary/50"
              )}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-display text-lg">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    chat.name.charAt(0).toUpperCase()
                  )}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground truncate">{chat.name}</span>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-foreground text-primary-foreground text-xs flex items-center justify-center">
                      {chat.unread}
                    </span>
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
