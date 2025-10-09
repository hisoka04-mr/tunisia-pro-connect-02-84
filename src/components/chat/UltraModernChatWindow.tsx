import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, User, CheckCheck, Check } from "lucide-react";
import { useChat, type Conversation, type Message } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface UltraModernChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export const UltraModernChatWindow = ({ conversation, onBack }: UltraModernChatWindowProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, fetchMessages } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation.booking_id) {
      fetchMessages(conversation.booking_id);
    }
  }, [conversation.booking_id, fetchMessages]);

  // Auto-scroll to bottom with better handling
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport || messages.length === 0) return;
    
    const shouldAutoScroll = isNearBottom || messages[messages.length - 1]?.sender_id === user?.id;
    
    if (shouldAutoScroll) {
      setTimeout(() => {
        viewport.scrollTo({ 
          top: viewport.scrollHeight, 
          behavior: messages.length <= 10 ? "auto" : "smooth" 
        });
      }, 50);
    }
  }, [messages, user?.id, isNearBottom]);

  // Track scroll position for auto-scroll behavior
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport) return;
    
    const onScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setIsNearBottom(distanceFromBottom < 150);
    };
    
    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial check
    
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [conversation.booking_id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setSending(true);
    setNewMessage(""); // Clear input immediately for better UX
    
    try {
      console.log('Sending message from UltraModernChatWindow:', { 
        bookingId: conversation.booking_id, 
        content: messageContent 
      });
      
      const result = await sendMessage(conversation.booking_id, messageContent);
      
      if (!result?.success) {
        console.error('Message sending failed:', result?.error);
        setNewMessage(messageContent); // Restore message on failure
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const otherUser = conversation.other_user;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Enhanced Header with User Info */}
      <div className="flex items-start gap-3 px-4 py-4 border-b border-border/10 bg-card/50 backdrop-blur-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="h-9 w-9 rounded-full hover:bg-muted/50 shrink-0 mt-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Profile Photo with Online Status */}
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={otherUser?.profile_photo_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            {/* Online Status Indicator */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-foreground">
                {otherUser?.first_name} {otherUser?.last_name}
              </h2>
              <span className="text-xs text-muted-foreground">
                • {conversation.last_message_date ? formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: true }) : ''}
              </span>
            </div>
            
            {/* Service/Booking Details */}
            <p className="text-sm text-muted-foreground truncate mb-1.5">
              {conversation.booking?.service_details || 'Service booking'}
            </p>
            
            {/* Role Badge and Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                {conversation.user_is_service_provider ? 'Provider' : 'Client'}
              </span>
              {conversation.booking?.scheduled_date && (
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  📅 {new Date(conversation.booking.scheduled_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-4 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <UltraModernMessageBubble 
                    key={message.id} 
                    message={message} 
                    isOwn={message.sender_id === user?.id}
                    showAvatar={index === 0 || messages[index - 1]?.sender_id !== message.sender_id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Ultra Clean Input */}
      <div className="px-4 py-4 border-t border-border/10 bg-background/95">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Tapez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="border-0 bg-muted/30 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all duration-200"
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface UltraModernMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const UltraModernMessageBubble = ({ message, isOwn, showAvatar }: UltraModernMessageBubbleProps) => {
  const senderName = message.sender?.first_name && message.sender?.last_name
    ? `${message.sender.first_name} ${message.sender.last_name}`
    : message.sender?.first_name || 'Unknown User';

  return (
    <div className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      {/* Profile Photo */}
      {!isOwn && (
        <div className="shrink-0">
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender?.profile_photo_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}
      
      {isOwn && showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender?.profile_photo_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      )}
      
      {isOwn && !showAvatar && (
        <div className="w-8" />
      )}
      
      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {/* Username above message */}
        {showAvatar && (
          <span className={cn(
            "text-xs font-medium mb-1 px-1",
            isOwn ? "text-primary" : "text-foreground"
          )}>
            {isOwn ? 'You' : senderName}
          </span>
        )}
        
        {/* Message Bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        {/* Timestamp and Read Status */}
        <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {isOwn && (
            <div className="text-muted-foreground">
              {message.is_read ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};