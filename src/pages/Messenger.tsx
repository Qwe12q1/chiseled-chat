import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatList from "@/components/messenger/ChatList";
import ChatView from "@/components/messenger/ChatView";
import EmptyChat from "@/components/messenger/EmptyChat";
import NewChatModal from "@/components/messenger/NewChatModal";
import SettingsPanel from "@/components/messenger/SettingsPanel";
import ProfilePanel from "@/components/messenger/ProfilePanel";
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

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  read: boolean;
}

const Messenger: React.FC = () => {
  const { user, loading } = useAuth();
  const { canSendMessage, remainingMessages, incrementMessageCount, isSubscribed } = useSubscription();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const fetchChats = async () => {
    if (!user) return;

    const { data: memberships } = await supabase
      .from("chat_members")
      .select(`
        chat_id,
        chats (
          id,
          name,
          type,
          created_at
        )
      `)
      .eq("user_id", user.id);

    if (memberships) {
      const chatPromises = memberships.map(async (m: any) => {
        const chat = m.chats;
        
        // Get other member for private chats
        let chatName = chat.name;
        if (chat.type === "private") {
          const { data: members } = await supabase
            .from("chat_members")
            .select("user_id, profiles(name)")
            .eq("chat_id", chat.id)
            .neq("user_id", user.id)
            .limit(1);
          
          if (members && members[0]) {
            chatName = (members[0] as any).profiles?.name || "Unknown";
          }
        }

        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: chat.id,
          name: chatName || "Чат",
          lastMessage: lastMsg?.content || "Нет сообщений",
          time: lastMsg ? formatTime(new Date(lastMsg.created_at)) : "",
          unread: 0,
        };
      });

      const formattedChats = await Promise.all(chatPromises);
      setChats(formattedChats);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id || "",
          timestamp: new Date(m.created_at),
          read: m.read_by?.includes(user?.id || "") || false,
        }))
      );
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.chat_id === selectedChatId) {
            setMessages((prev) => [
              ...prev,
              {
                id: newMessage.id,
                content: newMessage.content,
                senderId: newMessage.sender_id,
                timestamp: new Date(newMessage.created_at),
                read: false,
              },
            ]);
          }
          fetchChats(); // Refresh chat list for last message
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedChatId) return;

    if (!canSendMessage) {
      toast.error("Лимит сообщений исчерпан", {
        description: "Оформите подписку для безлимитных сообщений",
      });
      return;
    }

    const { error } = await supabase.from("messages").insert({
      chat_id: selectedChatId,
      sender_id: user.id,
      content,
    });

    if (!error && !isSubscribed) {
      await incrementMessageCount();
    }
  };

  const handleCreateChat = async (otherUserId: string) => {
    if (!user) return;

    // Create new chat
    const { data: newChat, error: chatError } = await supabase
      .from("chats")
      .insert({
        type: "private",
        created_by: user.id,
      })
      .select()
      .single();

    if (chatError || !newChat) return;

    // Add both users as members
    await supabase.from("chat_members").insert([
      { chat_id: newChat.id, user_id: user.id, role: "admin" },
      { chat_id: newChat.id, user_id: otherUserId, role: "member" },
    ]);

    setShowNewChat(false);
    fetchChats();
    setSelectedChatId(newChat.id);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return new Intl.DateTimeFormat("ru", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } else if (diffDays < 7) {
      return new Intl.DateTimeFormat("ru", { weekday: "short" }).format(date);
    } else {
      return new Intl.DateTimeFormat("ru", {
        day: "numeric",
        month: "short",
      }).format(date);
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Chat List */}
      <div
        className={cn(
          "h-full",
          isMobile
            ? selectedChatId
              ? "hidden"
              : "w-full"
            : "w-80 flex-shrink-0"
        )}
      >
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onNewChat={() => setShowNewChat(true)}
          onSettings={() => setShowSettings(true)}
          onProfile={() => setShowProfile(true)}
        />
      </div>

      {/* Chat View */}
      <div
        className={cn(
          "flex-1 h-full",
          isMobile && !selectedChatId && "hidden"
        )}
      >
        {selectedChat ? (
          <ChatView
            chatId={selectedChat.id}
            chatName={selectedChat.name}
            chatAvatar={selectedChat.avatar}
            isOnline={selectedChat.online}
            messages={messages}
            currentUserId={user?.id || ""}
            onBack={() => setSelectedChatId(null)}
            onSendMessage={handleSendMessage}
            remainingMessages={remainingMessages}
            isSubscribed={isSubscribed}
          />
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Modals & Panels */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreateChat={handleCreateChat}
      />
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <ProfilePanel
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};

export default Messenger;
