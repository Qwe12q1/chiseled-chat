import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreVertical, Send, Paperclip, Smile, Mic, Check, CheckCheck, Flag, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import ReportModal from "./ReportModal";

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
  const [reportMessage, setReportMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300 md:hidden"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </motion.button>

        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-display">
            {chatAvatar ? (
              <img src={chatAvatar} alt={chatName} className="w-full h-full rounded-full object-cover" />
            ) : (
              chatName.charAt(0).toUpperCase()
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-foreground">{chatName}</h2>
            {isOtherUserBlocked && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-destructive/10 rounded-sm text-xs text-destructive">
                <Ban size={12} />
                Заблокирован
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isOtherUserBlocked ? "Пользователь заблокирован" : isOnline ? "в сети" : "был(а) недавно"}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
        >
          <MoreVertical size={20} className="text-muted-foreground" />
        </motion.button>
      </div>

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
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("ru", { 
                        day: "numeric", 
                        month: "long" 
                      }).format(new Date(message.timestamp))}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2 rounded-sm relative group",
                      isOwn
                        ? "bg-foreground text-primary-foreground"
                        : "bg-secondary text-foreground"
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

                    {/* Report button for other's messages */}
                    {!isOwn && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                        onClick={() => setReportMessage(message)}
                        title="Пожаловаться"
                      >
                        <Flag size={14} className="text-muted-foreground hover:text-destructive" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        {!isSubscribed && remainingMessages !== Infinity && (
          <div className={cn(
            "mb-3 px-3 py-2 rounded-sm text-xs text-center",
            remainingMessages <= 2
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary text-muted-foreground"
          )}>
            {remainingMessages > 0
              ? `Осталось сообщений сегодня: ${remainingMessages}`
              : "Лимит сообщений исчерпан. Оформите подписку."}
          </div>
        )}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
          >
            <Paperclip size={20} className="text-muted-foreground" />
          </motion.button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение..."
              disabled={remainingMessages === 0}
              className="w-full h-11 px-4 bg-input border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-marble-vein transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
          >
            <Smile size={20} className="text-muted-foreground" />
          </motion.button>

          {newMessage.trim() ? (
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={remainingMessages === 0}
              className="p-2 rounded-sm bg-foreground text-primary-foreground hover:bg-marble-vein transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-sm hover:bg-secondary transition-colors duration-300"
            >
              <Mic size={20} className="text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </form>

      {/* Report Modal */}
      {reportMessage && otherUserId && (
        <ReportModal
          isOpen={!!reportMessage}
          onClose={() => setReportMessage(null)}
          messageId={reportMessage.id}
          messageContent={reportMessage.content}
          reportedUserId={otherUserId}
          chatId={chatId}
          reporterId={currentUserId}
        />
      )}
    </div>
  );
};

export default ChatView;
