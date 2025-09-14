import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const ChatNotificationBadge = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Function to count unread messages
    const countUnreadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, is_read, recipient_id")
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        if (error) throw error;
        const count = data?.length || 0;
        console.log(`Chat notification badge: ${count} unread messages for user ${user.id}`);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error counting unread messages:", error);
      }
    };

    // Initial count
    countUnreadMessages();

    // Subscribe to new messages with enhanced logging
    console.log('Setting up chat notification subscription for user:', user.id);
    
    const subscription = supabase
      .channel(`chat-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message received in notification badge:', payload.new);
          countUnreadMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Message updated in notification badge:', payload.new);
          countUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up chat notification subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <Link to="/chat">
      <Button variant="outline" size="sm" className="relative">
        <MessageCircle className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Messages</span>
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
};