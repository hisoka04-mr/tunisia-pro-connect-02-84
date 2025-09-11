import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, User, CheckCheck, Check, MoreVertical, Phone, Video } from "lucide-react";
import { useChat, type Conversation, type Message } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ModernChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ModernChatWindow = ({ conversation, onBack }: ModernChatWindowProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, fetchMessages } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation.booking_id) {
      fetchMessages(conversation.booking_id);
    }
  }, [conversation.booking_id, fetchMessages]);

  // Track and control auto-scroll respecting user's position
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport || messages.length === 0) return;
    const last = messages[messages.length - 1];
    const shouldAutoScroll = isNearBottom || last?.sender_id === user?.id;
    if (shouldAutoScroll) {
      // Use viewport scrolling for reliability across platforms (e.g., Windows)
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages, user?.id, isNearBottom]);

  // Observe viewport scroll to know if user is near bottom
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport) return;
    const onScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setIsNearBottom(distanceFromBottom < 120);
    };
    // Initialize
    onScroll();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [conversation.booking_id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setSending(true);
    
    try {
      console.log("Sending message:", messageContent);
      const result = await sendMessage(conversation.booking_id, messageContent);
      
      if (result?.success) {
        setNewMessage("");
        console.log("Message sent successfully");
      } else {
        console.error("Failed to send message:", result?.error);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
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

  const isServiceProvider = conversation.service_provider_id === user?.id;
  const otherUser = conversation.other_user;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
      {/* Modern Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-card/95 backdrop-blur-xl shrink-0 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="shrink-0 hover:bg-muted/50 rounded-full h-11 w-11 transition-all duration-300 hover:scale-105 group"
          aria-label="Go back to conversations"
        >
          <ArrowLeft className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
        </Button>
        
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <Avatar className="h-14 w-14 border-3 border-primary/20 shadow-lg ring-2 ring-background">
              <AvatarImage src={otherUser?.profile_photo_url || ""} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-lg">
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full animate-pulse"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate mb-1">
              {otherUser?.first_name} {otherUser?.last_name}
            </h2>
            <p className="text-sm text-muted-foreground truncate opacity-80">
              {conversation.booking?.service_details}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={isServiceProvider ? "default" : "secondary"} 
              className="shrink-0 font-medium px-3 py-1.5 rounded-full shadow-sm border-0 text-xs"
            >
              {isServiceProvider ? "Provider" : "Client"}
            </Badge>
            
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/50">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-6 py-6 space-y-6 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <div className="w-28 h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-8 shadow-xl border border-primary/10">
                  <User className="h-14 w-14 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Start the conversation</h3>
                <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
                  Send your first message to begin discussing this booking. We're here to help make your service experience amazing.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ModernMessageBubble 
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

      {/* Modern Input Area */}
      <div className="px-6 py-4 border-t bg-card/50 backdrop-blur-xl shrink-0">
        <div className="flex gap-3 items-end max-w-full">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="w-full bg-background/95 border-2 border-border/40 focus:border-primary/60 transition-all duration-300 rounded-2xl min-h-[56px] text-base px-6 py-4 shadow-sm hover:shadow-md focus:shadow-lg resize-none placeholder:text-muted-foreground/60"
              autoComplete="off"
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="shrink-0 h-[56px] w-[56px] rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 group"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ModernMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const ModernMessageBubble = ({ message, isOwn, showAvatar }: ModernMessageBubbleProps) => {
  return (
    <div className={`flex gap-3 group animate-fade-in ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <div className="shrink-0 w-10">
          {showAvatar ? (
            <Avatar className="h-10 w-10 border-2 border-border/30 shadow-md">
              <AvatarImage src={message.sender?.profile_photo_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 text-xs font-semibold">
                {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      )}
      
      <div className={`flex flex-col max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground mb-2 px-2">
            {message.sender?.first_name} {message.sender?.last_name}
          </span>
        )}
        
        <div
          className={`relative px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md group-hover:scale-[1.02] ${
            isOwn
              ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-md ml-10 shadow-primary/20"
              : "bg-gradient-to-r from-muted/90 to-muted/70 text-foreground rounded-bl-md mr-10 border border-border/20"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
          
          {/* Message tail */}
          <div 
            className={`absolute w-0 h-0 ${
              isOwn 
                ? "bottom-0 right-0 border-l-[12px] border-l-primary border-b-[12px] border-b-transparent"
                : "bottom-0 left-0 border-r-[12px] border-r-muted/90 border-b-[12px] border-b-transparent"
            }`}
          />
        </div>
        
        <div className={`flex items-center gap-2 mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}>
          <span className="text-xs text-muted-foreground font-medium">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {isOwn && (
            <div className="text-muted-foreground">
              {message.is_read ? (
                <CheckCheck className="h-3 w-3 text-green-500" />
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