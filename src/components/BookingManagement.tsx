import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookingRequestCard } from "@/components/BookingRequestCard";
import { ModernChatInterface } from "@/components/chat/ModernChatInterface";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  Calendar, 
  MessageCircle, 
  Clock, 
  CheckCircle2,
  XCircle,
  CalendarCheck,
  ClockIcon,
  Search,
  Filter,
  Plus,
  Inbox,
  CalendarDays,
  AlertTriangle
} from "lucide-react";

interface BookingData {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  total_price: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  service_provider_id: string;
  service_id: string;
  client_name?: string;
}

export const BookingManagement = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    bookingId: string;
    recipientId: string;
    recipientName: string;
  } | null>(null);
  
  const { user } = useAuth();
  const { userProfile, isServiceProvider, isClient } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userProfile) {
      fetchBookings();
      subscribeToBookings();
    }
  }, [user, userProfile, isServiceProvider, isClient]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (isServiceProvider) {
        // For service providers, show bookings for their services
        const { data: serviceProviderData } = await supabase
          .from('service_providers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (serviceProviderData) {
          query = query.eq('service_provider_id', serviceProviderData.id);
        }
      } else if (isClient) {
        // For clients, show their own bookings
        query = query.eq('client_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error loading bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToBookings = () => {
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchBookings(); // Refetch when any booking changes
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const getBookingsByStatus = (status: string) => {
    return filteredBookings.filter(booking => booking.status === status);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, dateFilter, statusFilter);
  };

  const handleDateFilter = (date: string) => {
    setDateFilter(date);
    applyFilters(searchQuery, date, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(searchQuery, dateFilter, status);
  };

  const applyFilters = (search: string, date: string, status: string) => {
    let filtered = [...bookings];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(booking => 
        booking.notes?.toLowerCase().includes(search.toLowerCase()) ||
        booking.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        booking.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply date filter
    if (date) {
      filtered = filtered.filter(booking => 
        booking.booking_date === date
      );
    }

    // Apply status filter (only if different from current tab)
    if (status && status !== "all" && status !== activeTab) {
      filtered = filtered.filter(booking => booking.status === status);
    }

    setFilteredBookings(filtered);
  };

  const handleNewService = () => {
    if (isServiceProvider) {
      navigate("/services");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("");
    setStatusFilter("all");
    setFilteredBookings(bookings);
  };

  const getStatusCounts = () => {
    return {
      pending: filteredBookings.filter(b => b.status === 'pending').length,
      confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
      declined: filteredBookings.filter(b => b.status === 'declined').length,
      completed: filteredBookings.filter(b => b.status === 'completed').length,
    };
  };

  const openChat = async (booking: BookingData) => {
    try {
      let recipientId: string;
      
      if (isServiceProvider) {
        // If current user is service provider, recipient is the client
        recipientId = booking.client_id;
      } else {
        // If current user is client, recipient is the service provider's user_id
        const { data: providerData, error } = await supabase
          .from('service_providers')
          .select('user_id')
          .eq('id', booking.service_provider_id)
          .single();
          
        if (error || !providerData) {
          toast({
            title: "Error",
            description: "Unable to load chat. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        recipientId = providerData.user_id;
      }
      
      const recipientName = booking.client_name || 'User';

      setSelectedChat({
        bookingId: booking.id,
        recipientId,
        recipientName,
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      toast({
        title: "Error",
        description: "Unable to open chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading your bookings</h3>
          <p className="text-muted-foreground">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-8">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-background via-background to-muted/20 rounded-3xl p-8 border border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {isServiceProvider ? "Booking Requests" : "My Bookings"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isServiceProvider 
                ? "Manage incoming booking requests and communicate with clients"
                : "Track your service bookings and chat with providers"
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2 rounded-2xl">
                  <Search className="h-5 w-5" />
                  Search
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Search Bookings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search by booking ID, client name, or notes..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button onClick={clearFilters} variant="outline" size="sm">
                      Clear
                    </Button>
                    <Button onClick={() => setIsSearchOpen(false)} size="sm">
                      Done
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2 rounded-2xl">
                  <Filter className="h-5 w-5" />
                  Filter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Bookings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => handleDateFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={clearFilters} variant="outline" size="sm">
                      Clear Filters
                    </Button>
                    <Button onClick={() => setIsFilterOpen(false)} size="sm">
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {isServiceProvider && (
              <Button 
                onClick={handleNewService}
                size="lg" 
                className="gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
              >
                <Plus className="h-5 w-5" />
                New Service
              </Button>
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatsCard 
            title="Pending" 
            count={statusCounts.pending} 
            icon={ClockIcon} 
            color="orange" 
          />
          <StatsCard 
            title="Confirmed" 
            count={statusCounts.confirmed} 
            icon={CheckCircle2} 
            color="blue" 
          />
          <StatsCard 
            title="Declined" 
            count={statusCounts.declined} 
            icon={XCircle} 
            color="red" 
          />
          <StatsCard 
            title="Completed" 
            count={statusCounts.completed} 
            icon={CalendarCheck} 
            color="green" 
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-2 rounded-2xl h-auto gap-2">
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-3 py-4 px-6 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-orange-600/5 data-[state=active]:border data-[state=active]:border-orange-200/30 data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Pending</div>
              <div className="text-xs text-muted-foreground">{statusCounts.pending} requests</div>
            </div>
            {statusCounts.pending > 0 && (
              <Badge className="bg-orange-500/20 text-orange-700 border-orange-300/30">
                {statusCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="confirmed" 
            className="flex items-center gap-3 py-4 px-6 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-blue-600/5 data-[state=active]:border data-[state=active]:border-blue-200/30 data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Confirmed</div>
              <div className="text-xs text-muted-foreground">{statusCounts.confirmed} active</div>
            </div>
            {statusCounts.confirmed > 0 && (
              <Badge className="bg-blue-500/20 text-blue-700 border-blue-300/30">
                {statusCounts.confirmed}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="declined" 
            className="flex items-center gap-3 py-4 px-6 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/10 data-[state=active]:to-red-600/5 data-[state=active]:border data-[state=active]:border-red-200/30 data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Declined</div>
              <div className="text-xs text-muted-foreground">{statusCounts.declined} rejected</div>
            </div>
            {statusCounts.declined > 0 && (
              <Badge className="bg-red-500/20 text-red-700 border-red-300/30">
                {statusCounts.declined}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="completed" 
            className="flex items-center gap-3 py-4 px-6 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/10 data-[state=active]:to-green-600/5 data-[state=active]:border data-[state=active]:border-green-200/30 data-[state=active]:shadow-lg transition-all duration-300"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Completed</div>
              <div className="text-xs text-muted-foreground">{statusCounts.completed} finished</div>
            </div>
            {statusCounts.completed > 0 && (
              <Badge className="bg-green-500/20 text-green-700 border-green-300/30">
                {statusCounts.completed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 animate-fade-in">
          {getBookingsByStatus('pending').length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="No pending requests"
              description={isServiceProvider 
                ? "You don't have any pending booking requests at the moment. New requests will appear here."
                : "You haven't made any booking requests that are still pending approval."
              }
              color="orange"
            />
          ) : (
            <div className="space-y-4">
              {getBookingsByStatus('pending').map((booking, index) => (
                <div key={booking.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookingRequestCard
                    booking={booking}
                    onStatusUpdate={fetchBookings}
                    onOpenChat={openChat}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-6 animate-fade-in">
          {getBookingsByStatus('confirmed').length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No confirmed bookings"
              description={isServiceProvider 
                ? "No confirmed bookings yet. Once you accept requests, they'll appear here."
                : "You don't have any confirmed bookings. Book a service to see confirmed appointments here."
              }
              color="blue"
              actionButton={
                !isServiceProvider ? (
                  <Button className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Browse Services
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {getBookingsByStatus('confirmed').map((booking, index) => (
                <div key={booking.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookingRequestCard
                    booking={booking}
                    onStatusUpdate={fetchBookings}
                    onOpenChat={openChat}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="declined" className="space-y-6 animate-fade-in">
          {getBookingsByStatus('declined').length === 0 ? (
            <EmptyState
              icon={XCircle}
              title="No declined bookings"
              description="Declined bookings will appear here. This helps you track requests that weren't accepted."
              color="red"
            />
          ) : (
            <div className="space-y-4">
              {getBookingsByStatus('declined').map((booking, index) => (
                <div key={booking.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookingRequestCard
                    booking={booking}
                    onStatusUpdate={fetchBookings}
                    onOpenChat={openChat}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 animate-fade-in">
          {getBookingsByStatus('completed').length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No completed bookings"
              description="Completed bookings and their history will appear here once services are finished."
              color="green"
            />
          ) : (
            <div className="space-y-4">
              {getBookingsByStatus('completed').map((booking, index) => (
                <div key={booking.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookingRequestCard
                    booking={booking}
                    onStatusUpdate={fetchBookings}
                    onOpenChat={openChat}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modern Chat Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] animate-scale-in">
            <ModernChatInterface
              bookingId={selectedChat.bookingId}
              otherUser={{
                id: selectedChat.recipientId,
                first_name: selectedChat.recipientName?.split(' ')[0] || 'User',
                last_name: selectedChat.recipientName?.split(' ')[1] || '',
                profile_photo_url: null
              }}
              bookingDetails={{
                service_details: 'Service booking',
                scheduled_date: new Date().toISOString().split('T')[0],
                scheduled_time: '10:00'
              }}
              onClose={() => setSelectedChat(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Stats Card Component
interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'orange' | 'blue' | 'red' | 'green';
}

const StatsCard = ({ title, count, icon: Icon, color }: StatsCardProps) => {
  const colorClasses = {
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-200/30 text-orange-700',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/30 text-blue-700',
    red: 'from-red-500/10 to-red-600/5 border-red-200/30 text-red-700',
    green: 'from-green-500/10 to-green-600/5 border-green-200/30 text-green-700',
  };

  const iconColors = {
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <Card className={`bg-gradient-to-r ${colorClasses[color]} border hover:shadow-lg transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${iconColors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{count}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Modern Empty State Component
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: 'orange' | 'blue' | 'red' | 'green';
  actionButton?: React.ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, color, actionButton }: EmptyStateProps) => {
  const iconColors = {
    orange: 'from-orange-500/20 to-orange-600/10 text-orange-600 dark:text-orange-400',
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400',
    red: 'from-red-500/20 to-red-600/10 text-red-600 dark:text-red-400',
    green: 'from-green-500/20 to-green-600/10 text-green-600 dark:text-green-400',
  };

  return (
    <Card className="border-dashed border-2 border-border/50 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className={`w-20 h-20 bg-gradient-to-r ${iconColors[color]} rounded-full flex items-center justify-center mb-6 animate-pulse`}>
          <Icon className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
          {description}
        </p>
        {actionButton && actionButton}
      </CardContent>
    </Card>
  );
};