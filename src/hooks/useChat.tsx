import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/utils/notificationService";

export interface Conversation {
  booking_id: string;
  service_provider_id: string;
  client_id: string;
  last_message_date: string;
  user_is_service_provider?: boolean;
  // Joined data
  booking?: {
    service_details: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string | null;
  };
  other_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
  };
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  sender?: {
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
  };
}

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Fetch conversations for current user (based on bookings with messages)
  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get unique bookings where user has exchanged messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("booking_id, created_at")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Group by booking_id and get the latest message date
      const bookingGroups = messagesData?.reduce((acc: Record<string, string>, msg) => {
        if (!acc[msg.booking_id] || msg.created_at > acc[msg.booking_id]) {
          acc[msg.booking_id] = msg.created_at;
        }
        return acc;
      }, {});

      // Get booking details for each conversation
      const conversationsWithUsers = await Promise.all(
        Object.entries(bookingGroups || {}).map(async ([bookingId, lastMessageDate]) => {
          const { data: bookingData } = await supabase
            .from("bookings")
            .select("booking_date, booking_time, status, client_id, service_provider_id, notes, service_id")
            .eq("id", bookingId)
            .single();

          if (!bookingData) return null;

          // Get service details if service_id exists
          let serviceTitle = bookingData.notes || "Service booking";
          if (bookingData.service_id) {
            const { data: serviceData } = await supabase
              .from("services")
              .select("*")
              .eq("id", bookingData.service_id)
              .single();
            
            serviceTitle = serviceData?.description || bookingData.notes || "Service booking";
          }

          // First check if current user is a service provider and if this booking is theirs
          const { data: currentUserServiceProvider } = await supabase
            .from("service_providers")
            .select("id")
            .eq("user_id", user.id)
            .eq("id", bookingData.service_provider_id)
            .single();
          
          const isCurrentUserServiceProvider = !!currentUserServiceProvider;
          
          // Get the actual user ID of the other party
          let otherUserId: string;
          if (isCurrentUserServiceProvider) {
            otherUserId = bookingData.client_id;
          } else {
            // Current user is client, need to get service provider's user_id
            const { data: serviceProviderData } = await supabase
              .from("service_providers")
              .select("user_id")
              .eq("id", bookingData.service_provider_id)
              .single();
            
            if (!serviceProviderData) {
              console.warn(`Skipping conversation: service provider ${bookingData.service_provider_id} not found`);
              return null;
            }
            otherUserId = serviceProviderData.user_id;
          }

const { data: userData } = await supabase
  .from("profiles")
  .select("id, first_name, last_name, profile_photo_url")
  .eq("id", otherUserId)
  .maybeSingle();

const otherUser = userData || {
  id: otherUserId,
  first_name: "User",
  last_name: "",
  profile_photo_url: null,
};

return {
  booking_id: bookingId,
  service_provider_id: bookingData.service_provider_id,
  client_id: bookingData.client_id,
  last_message_date: lastMessageDate,
  user_is_service_provider: isCurrentUserServiceProvider,
  booking: {
    service_details: serviceTitle,
    scheduled_date: bookingData.booking_date,
    scheduled_time: bookingData.booking_time,
    status: bookingData.status
  },
  other_user: otherUser
};
        })
      );

      const validConversations = conversationsWithUsers.filter(Boolean) as Conversation[];
      validConversations.sort((a, b) => new Date(b.last_message_date).getTime() - new Date(a.last_message_date).getTime());
      
      setConversations(validConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error loading conversations",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a booking conversation
  const fetchMessages = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *
        `)
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get sender details for each message
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (message) => {
          const { data: senderData } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_photo_url")
            .eq("id", message.sender_id)
            .single();

          return {
            ...message,
            sender: senderData
          };
        })
      );

      setMessages(messagesWithSenders);
      setCurrentConversationId(bookingId);

      // Mark messages as read if they're not from current user
      const unreadMessages = data?.filter(msg => 
        msg.sender_id !== user?.id && !msg.is_read
      ) || [];

      if (unreadMessages.length > 0) {
        await markMessagesAsRead(bookingId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Send a message
  const sendMessage = async (bookingId: string, content: string) => {
    if (!user || !content.trim()) return { success: false, error: "Invalid input" };

    try {
      console.log('useChat: Sending message:', { bookingId, content, userId: user.id });
      
      // Get booking details to determine recipient
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("client_id, service_provider_id")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        console.error('useChat: Booking fetch error:', bookingError);
        throw new Error("Could not find booking details");
      }

      // Check if current user is the service provider for this booking
      const { data: currentUserServiceProvider } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", booking.service_provider_id)
        .single();
      
      const isCurrentUserServiceProvider = !!currentUserServiceProvider;
      
      // Determine recipient user ID properly
      let recipientId: string;
      if (isCurrentUserServiceProvider) {
        // Current user is service provider, recipient is client
        recipientId = booking.client_id;
      } else {
        // Current user is client, need to get service provider's user_id
        const { data: serviceProviderData } = await supabase
          .from("service_providers")
          .select("user_id")
          .eq("id", booking.service_provider_id)
          .single();
        
        if (!serviceProviderData) {
          throw new Error("Service provider not found");
        }
        recipientId = serviceProviderData.user_id;
      }

      // Try to fetch recipient profile (optional, don't block sending)
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", recipientId)
        .maybeSingle();

      if (!recipientProfile) {
        console.warn('useChat: Recipient not found in profiles, proceeding with send:', recipientId);
      }

      const messageData = {
        booking_id: bookingId,
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        is_read: false
      };

      console.log('useChat: Inserting message:', messageData);

      // Insert the message
      const { data: insertedMessage, error: insertError } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (insertError) {
        console.error('useChat: Insert error:', insertError);
        throw insertError;
      }

      console.log('useChat: Message inserted successfully:', insertedMessage);

      // Get sender profile for display
      const { data: senderData } = await supabase
        .from("profiles")
        .select("first_name, last_name, profile_photo_url")
        .eq("id", user.id)
        .single();

      const messageWithSender = {
        ...insertedMessage,
        sender: senderData
      };

      // Add message to local state immediately for better UX
      setMessages(prev => [...prev, messageWithSender]);

      // Create notification for recipient
      try {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        const { data: bookingData } = await supabase
          .from("bookings")
          .select("notes, service_id")
          .eq("id", bookingId)
          .single();

        let serviceDetails = bookingData?.notes || "Service booking";
        if (bookingData?.service_id) {
          const { data: serviceData } = await supabase
            .from("services")
            .select("description")
            .eq("id", bookingData.service_id)
            .single();
          serviceDetails = serviceData?.description || bookingData?.notes || "Service booking";
        }

        const senderName = `${senderProfile?.first_name} ${senderProfile?.last_name}`;
        
        await notificationService.createNewMessageNotification(
          recipientId,
          senderName,
          serviceDetails,
          bookingId
        );
      } catch (notifError) {
        console.error("Error creating message notification:", notifError);
      }

      return { success: true, message: messageWithSender };
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (bookingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("booking_id", bookingId)
        .eq("recipient_id", user.id) // Only mark messages TO this user as read
        .eq("is_read", false);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.booking_id === bookingId && msg.recipient_id === user.id
            ? { ...msg, is_read: true }
            : msg
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Subscribe to real-time message updates for current conversation
  useEffect(() => {
    if (!user || !currentConversationId) return;

    console.log('Setting up real-time subscription for conversation:', currentConversationId);

    const subscription = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${currentConversationId}`,
        },
        async (payload) => {
          console.log('Real-time message received:', payload.new);
          const newMessage = payload.new as Message;
          
          // Only add if not from current user (sender already added it locally)
          if (newMessage.sender_id !== user.id) {
            // Get sender info
            const { data: senderData } = await supabase
              .from("profiles")
              .select("first_name, last_name, profile_photo_url")
              .eq("id", newMessage.sender_id)
              .single();

            const messageWithSender = {
              ...newMessage,
              sender: senderData
            };

            setMessages(prev => {
              // Don't add if message already exists (prevent duplicates)
              if (prev.find(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, messageWithSender];
            });

            // Mark as read after a short delay
            setTimeout(() => markMessagesAsRead(currentConversationId), 1000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${currentConversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload.new);
          const updatedMessage = payload.new as Message;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for:', currentConversationId);
      subscription.unsubscribe();
    };
  }, [user, currentConversationId]);

  // Subscribe to all message updates to refresh conversations list
  useEffect(() => {
    if (!user) return;

    console.log('Setting up global message subscription for user:', user.id);

    const subscription = supabase
      .channel("all-messages-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message received for user, refreshing conversations:', payload.new);
          // Refresh conversations when user receives a new message
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message sent by user, refreshing conversations:', payload.new);
          // Refresh conversations when user sends a message
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up global message subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    currentConversationId,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
  };
};