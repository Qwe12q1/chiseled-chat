import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, Flag, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import ReportModal from "./ReportModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  read: boolean;
}

interface ChatViewProps {
  chatId: string;
  chatName: string;
  chatAvatar?: string;
  isOnline?: boolean;
  messages: Message[];
  currentUserId: string;
  otherUserId?: string;
  isOtherUserBlocked?: boolean;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  remainingMessages?: number;
  isSubscribed?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  chatName,
  chatAvatar,
  isOnline,
  messages,
  currentUserId,
  otherUserId,
  isOtherUserBlocked = false,
  onBack,
  onSendMessage,
  remainingMessages = Infinity,
  isSubscribed = false,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if other user has sent any messages
  const otherUserHasMessages = messages.some(m => m.senderId !== currentUserId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ru", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 p-4 border-b border-border bg-card"
      >
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300 md:hidden"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </motion.button>

        <div className="relative">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-foreground font-display overflow-hidden shadow-sm"
          >
            {chatAvatar ? (
              <img src={chatAvatar} alt={chatName} className="w-full h-full object-cover" />
            ) : (
              chatName.charAt(0).toUpperCase()
            )}
          </motion.div>
          {isOnline && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card shadow-sm" 
            />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-foreground">{chatName}</h2>
            {isOtherUserBlocked && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 bg-destructive/15 rounded-xl text-xs text-destructive font-medium"
              >
                <Ban size={12} />
                Заблокирован
              </motion.span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isOtherUserBlocked ? "Пользователь заблокирован" : isOnline ? "в сети" : "был(а) недавно"}
          </p>
        </div>

        {!isOtherUserBlocked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
              >
                <MoreVertical size={20} className="text-muted-foreground" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              {otherUserId && otherUserHasMessages && (
                <DropdownMenuItem 
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer rounded-xl"
                >
                  <Flag size={16} />
                  Пожаловаться
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showDate = index === 0 || 
              new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString();

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-4"
                  >
                    <span className="px-4 py-1.5 bg-secondary/80 backdrop-blur-sm rounded-2xl text-xs text-muted-foreground shadow-sm">
                      {new Intl.DateTimeFormat("ru", { 
                        day: "numeric", 
                        month: "long" 
                      }).format(new Date(message.timestamp))}
                    </span>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 relative group shadow-sm",
                      isOwn
                        ? "bg-foreground text-primary-foreground rounded-3xl rounded-br-lg"
                        : "bg-secondary text-foreground rounded-3xl rounded-bl-lg"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      isOwn ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-[10px]",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {formatTime(new Date(message.timestamp))}
                      </span>
                      {isOwn && (
                        message.read ? (
                          <CheckCheck size={14} className="text-primary-foreground/70" />
                        ) : (
                          <Check size={14} className="text-primary-foreground/70" />
                        )
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit} 
        className="p-4 border-t border-border bg-card"
      >
        {isOtherUserBlocked && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2.5 rounded-2xl text-xs text-center bg-destructive/15 text-destructive"
          >
            Пользователь заблокирован. Отправка сообщений невозможна.
          </motion.div>
        )}
        {!isOtherUserBlocked && !isSubscribed && remainingMessages !== Infinity && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-3 px-4 py-2.5 rounded-2xl text-xs text-center",
              remainingMessages <= 2
                ? "bg-destructive/15 text-destructive"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {remainingMessages > 0
              ? `Осталось сообщений сегодня: ${remainingMessages}`
              : "Лимит сообщений исчерпан. Оформите подписку."}
          </motion.div>
        )}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.15, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
          >
            <Paperclip size={20} className="text-muted-foreground" />
          </motion.button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isOtherUserBlocked ? "Отправка невозможна..." : "Написать сообщение..."}
              disabled={remainingMessages === 0 || isOtherUserBlocked}
              className="w-full h-12 px-5 bg-input border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein focus:ring-2 focus:ring-marble-vein/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.15, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
          >
            <Smile size={20} className="text-muted-foreground" />
          </motion.button>

          <AnimatePresence mode="wait">
            {newMessage.trim() ? (
              <motion.button
                key="send"
                type="submit"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={remainingMessages === 0 || isOtherUserBlocked}
                className="p-3 rounded-2xl bg-foreground text-primary-foreground hover:bg-marble-vein transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send size={20} />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl hover:bg-secondary transition-all duration-300"
              >
                <Mic size={20} className="text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.form>

      {/* Report Modal */}
      {showReport && otherUserId && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          reportedUserId={otherUserId}
          chatId={chatId}
          reporterId={currentUserId}
        />
      )}
    </div>
  );
};

export default ChatView;
