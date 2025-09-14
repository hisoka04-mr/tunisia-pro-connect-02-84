import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Clock, Loader2 } from "lucide-react";
import { type Conversation } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  loading: boolean;
  selectedConversationId?: string;
}

export const ConversationList = ({ 
  conversations, 
  onSelectConversation, 
  loading,
  selectedConversationId
}: ConversationListProps) => {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-muted/30 to-muted/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conversations will appear here after bookings are confirmed and messages are exchanged.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.booking_id}
            conversation={conversation}
            onClick={() => onSelectConversation(conversation)}
            isServiceProvider={conversation.user_is_service_provider ?? (conversation.service_provider_id === user?.id)}
            isSelected={conversation.booking_id === selectedConversationId}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
  isServiceProvider: boolean;
  isSelected?: boolean;
}

const ConversationItem = ({ conversation, onClick, isServiceProvider, isSelected }: ConversationItemProps) => {
  const otherUser = conversation.other_user;
  const timeAgo = formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 shadow-lg' 
          : 'hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/20 border border-border/20 hover:border-border/40'
      }`}
    >
      {/* Avatar with Online Indicator */}
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 border-3 border-background shadow-lg ring-2 ring-border/20 transition-all group-hover:ring-primary/30">
          <AvatarImage src={otherUser?.profile_photo_url || ""} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
            {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Name and Time */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {otherUser?.first_name} {otherUser?.last_name}
          </h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
            <Clock className="h-3 w-3" />
            <span className="font-medium">{timeAgo.replace('about ', '')}</span>
          </div>
        </div>
        
        {/* Service Details */}
        <p className="text-sm text-muted-foreground truncate mb-3 leading-relaxed">
          {conversation.booking?.service_details}
        </p>
        
        {/* Badge and Booking Info */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={isServiceProvider ? "default" : "secondary"} 
            className="text-xs font-semibold px-3 py-1 rounded-full border-0 shadow-sm"
          >
            {isServiceProvider ? "🏪 Provider" : "👤 Client"}
          </Badge>
          
          {conversation.booking?.scheduled_date && (
            <div className="text-xs text-muted-foreground font-medium">
              📅 {conversation.booking?.scheduled_date}
            </div>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full shrink-0 shadow-lg"></div>
      )}
    </div>
  );
};