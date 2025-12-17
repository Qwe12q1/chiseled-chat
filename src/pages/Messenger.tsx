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
import BlockedUserScreen from "@/components/messenger/BlockedUserScreen";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar?: string;
  online?: boolean;
  otherUserId?: string;
  isOtherUserBlocked?: boolean;
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
  const [isMobile, setIsMobile] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | undefined>();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Check if current user is blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked")
        .eq("id", user.id)
        .single();

      if (profile?.is_blocked) {
        // Get block reason
        const { data: blockData } = await supabase
          .from("blocked_users")
          .select("reason")
          .eq("user_id", user.id)
          .order("blocked_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setIsBlocked(true);
        setBlockReason(blockData?.reason || undefined);
      }
    };

    checkBlockStatus();
  }, [user]);

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

    const { data: memberships, error: membershipsError } = await supabase
      .from("chat_members")
      .select(
        `
        chat_id,
        chats!chat_members_chat_id_fkey (
          id,
          name,
          type,
          created_at
        )
      `
      )
      .eq("user_id", user.id);

    if (membershipsError) {
      console.error("fetchChats: membershipsError", membershipsError);
      toast.error("Не удалось загрузить чаты", {
        description: membershipsError.message,
      });
      return;
    }

    if (memberships) {
      const chatPromises = memberships.map(async (m: any) => {
        const chat = m.chats;

        // Get other member for private chats
        let chatName = chat.name;
        let otherUserId: string | undefined;
        let isOtherUserBlocked = false;

        if (chat.type === "private") {
          const { data: members, error: membersError } = await supabase
            .from("chat_members")
            .select("user_id, profiles!chat_members_user_id_profiles_fkey(name, is_blocked)")
            .eq("chat_id", chat.id)
            .neq("user_id", user.id)
            .limit(1);

          if (membersError) {
            console.error("fetchChats: membersError", membersError);
          }

          if (members && members[0]) {
            const member = members[0] as any;
            chatName = member.profiles?.name || "Unknown";
            otherUserId = member.user_id;
            isOtherUserBlocked = member.profiles?.is_blocked || false;
          }
        }

        // Get last message
        const { data: lastMsg, error: lastMsgError } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsgError) {
          console.error("fetchChats: lastMsgError", lastMsgError);
        }

        return {
          id: chat.id,
          name: chatName || "Чат",
          lastMessage: lastMsg?.content || "Нет сообщений",
          time: lastMsg ? formatTime(new Date(lastMsg.created_at)) : "",
          unread: 0,
          otherUserId,
          isOtherUserBlocked,
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
          // Add message only if not already in state (avoids duplicates from optimistic update)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            // Only add if it's for the current chat (check via prev messages' chat context)
            return [
              ...prev,
              {
                id: newMessage.id,
                content: newMessage.content,
                senderId: newMessage.sender_id,
                timestamp: new Date(newMessage.created_at),
                read: false,
              },
            ];
          });
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

    // Insert and return the new message for optimistic update
    const { data: newMsg, error } = await supabase
      .from("messages")
      .insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("handleSendMessage error:", error);
      toast.error("Не удалось отправить сообщение");
      return;
    }

    // Optimistic update: add message to local state immediately
    if (newMsg) {
      setMessages((prev) => [
        ...prev,
        {
          id: newMsg.id,
          content: newMsg.content,
          senderId: newMsg.sender_id || "",
          timestamp: new Date(newMsg.created_at),
          read: false,
        },
      ]);
    }

    if (!isSubscribed) {
      await incrementMessageCount();
    }
  };

  const handleCreateChat = async (otherUserId: string) => {
    if (!user) {
      toast.error("Нужно войти", { description: "Сначала авторизуйтесь" });
      return;
    }

    const loadingToastId = toast.loading("Создаём чат...");

    // Ensure we have an auth session (RLS relies on auth.uid())
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id;

    if (authError || !authUserId) {
      console.error("handleCreateChat: authError", authError);
      toast.error("Сессия не найдена", {
        id: loadingToastId,
        description: "Выйдите и войдите заново, затем попробуйте снова",
      });
      return;
    }

    // Proactively refresh session to avoid token-expiry RLS failures
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error("handleCreateChat: refreshError", refreshError);
      toast.error("Не удалось обновить сессию", {
        id: loadingToastId,
        description: "Выйдите и войдите заново, затем попробуйте снова",
      });
      return;
    }

    // Create chat + members atomically via backend function (avoids RLS multi-step failures)
    const { data: chatId, error: rpcError } = await (supabase as any).rpc(
      "create_private_chat",
      { other_user_id: otherUserId }
    );

    if (rpcError || !chatId) {
      console.error("handleCreateChat: rpcError", rpcError);
      const details = [
        rpcError?.message,
        (rpcError as any)?.details,
        (rpcError as any)?.hint,
        (rpcError as any)?.code,
      ]
        .filter(Boolean)
        .join(" • ");

      toast.error("Не удалось создать чат", {
        id: loadingToastId,
        description: details || "Попробуйте ещё раз",
      });
      return;
    }

    setShowNewChat(false);
    await fetchChats();
    setSelectedChatId(chatId);

    toast.success("Чат создан", { id: loadingToastId });
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

  // Show blocked screen if user is blocked
  if (isBlocked) {
    return <BlockedUserScreen reason={blockReason} />;
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
            otherUserId={selectedChat.otherUserId}
            isOtherUserBlocked={selectedChat.isOtherUserBlocked}
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
    </div>
  );
};

export default Messenger;
