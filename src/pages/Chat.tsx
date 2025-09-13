import { useState } from "react";
import { UltraModernChatWindow } from "@/components/chat/UltraModernChatWindow";
import { ConversationList } from "@/components/chat/ConversationList";
import { useChat, type Conversation } from "@/hooks/useChat";
import { MessageCircle, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const { conversations, loading } = useChat();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.other_user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.booking?.service_details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1">
        {/* Sidebar - Conversations List */}
        <div className="w-96 border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/60 border-border/30 focus:border-primary/40 rounded-xl"
              />
            </div>
          </div>
          
          {/* Conversations */}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={filteredConversations}
              onSelectConversation={handleSelectConversation}
              loading={loading}
              selectedConversationId={selectedConversation?.booking_id}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <UltraModernChatWindow 
              conversation={selectedConversation} 
              onBack={handleBackToList}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/10">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">Select a conversation</h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Choose a conversation from the sidebar to start chatting with your clients or service providers.
                </p>
                <Button variant="outline" size="lg" className="rounded-xl px-8 py-3">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start New Booking
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex-1 flex flex-col">
        {selectedConversation ? (
          <UltraModernChatWindow 
            conversation={selectedConversation} 
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile Header */}
            <div className="p-4 bg-card/80 backdrop-blur-xl border-b border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Messages</h1>
                  <p className="text-xs text-muted-foreground">
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/60 border-border/30 focus:border-primary/40 rounded-xl"
                />
              </div>
            </div>
            
            {/* Mobile Conversations */}
            <div className="flex-1 overflow-hidden">
              <ConversationList
                conversations={filteredConversations}
                onSelectConversation={handleSelectConversation}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;