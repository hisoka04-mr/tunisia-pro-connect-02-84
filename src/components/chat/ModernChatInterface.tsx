import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ModernChatInterfaceProps {
  bookingId: string;
  otherUser: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
  };
  bookingDetails: {
    service_details: string;
    scheduled_date: string;
    scheduled_time: string;
  };
  onClose: () => void;
}

export const ModernChatInterface = ({ 
  bookingId, 
  otherUser, 
  bookingDetails, 
  onClose 
}: ModernChatInterfaceProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, fetchMessages } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when component mounts
  useEffect(() => {
    if (bookingId) {
      fetchMessages(bookingId);
    }
  }, [bookingId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const result = await sendMessage(bookingId, newMessage);
    if (result?.success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-0 shadow-2xl bg-background/95 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
        <Button variant="ghost" size="icon" onClick={onClose} className="mr-3 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-12 w-12 mr-4 border-2 border-primary/20">
          <AvatarImage src={otherUser?.profile_photo_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground">
            {otherUser?.first_name} {otherUser?.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {bookingDetails?.service_details}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(bookingDetails?.scheduled_date).toLocaleDateString()} à {bookingDetails?.scheduled_time}
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <MessageCircle className="h-3 w-3 mr-1" />
          Chat
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun message pour le moment</p>
                <p className="text-sm">Commencez la conversation en envoyant un message</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwn={message.sender_id === user?.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border/50 p-6 bg-gradient-to-r from-background to-muted/10">
          <div className="flex gap-3">
            <Input
              placeholder="Tapez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={message.sender?.profile_photo_url || ""} />
              <AvatarFallback className="text-xs bg-muted">
                {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground font-medium">
              {message.sender?.first_name} {message.sender?.last_name}
            </span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isOwn
              ? "bg-primary text-primary-foreground ml-2"
              : "bg-muted/70 mr-2"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className={`text-xs mt-2 ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};