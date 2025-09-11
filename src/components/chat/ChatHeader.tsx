import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { useChat, type Conversation } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { ChatWindow } from "./ChatWindow";
import { formatDistanceToNow } from "date-fns";

export const ChatHeader = () => {
  const { user } = useAuth();
  const { conversations, loading } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Count unread conversations
  useEffect(() => {
    if (!conversations || !user) return;
    
    // This is a simplified count - in a real app you'd track unread messages per conversation
    const unread = conversations.length;
    setUnreadCount(unread);
  }, [conversations, user]);

  if (!user) return null;

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedConversation(null);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs p-0 min-w-[24px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96">
          <Card className="shadow-2xl border-2">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {selectedConversation ? "Chat" : "Messages"}
              </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-0">
              {selectedConversation ? (
                <div className="h-96">
                  <ChatWindow 
                    conversation={selectedConversation} 
                    onBack={handleBackToList}
                  />
                </div>
              ) : (
                <div className="h-96">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune conversation</p>
                      <p className="text-sm">Les conversations apparaîtront après confirmation des réservations</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="space-y-2 p-4">
                        {conversations.map((conversation) => (
                          <ConversationItemMini
                            key={conversation.booking_id}
                            conversation={conversation}
                            onClick={() => handleSelectConversation(conversation)}
                            isServiceProvider={conversation.service_provider_id === user?.id}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

interface ConversationItemMiniProps {
  conversation: Conversation;
  onClick: () => void;
  isServiceProvider: boolean;
}

const ConversationItemMini = ({ conversation, onClick, isServiceProvider }: ConversationItemMiniProps) => {
  const otherUser = conversation.other_user;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={otherUser?.profile_photo_url || ""} />
        <AvatarFallback className="text-xs">
          {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate">
            {otherUser?.first_name} {otherUser?.last_name}
          </h4>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: true })}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground truncate">
          {conversation.booking?.service_details}
        </p>
      </div>
    </div>
  );
};