import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const BookingStatusManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Subscribe to booking status changes for providers only
    const subscription = supabase
      .channel('booking-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          const booking = payload.new;
          const oldBooking = payload.old;
          
          // Check if this user is the service provider for this booking
          const { data: serviceProvider } = await supabase
            .from('service_providers')
            .select('user_id')
            .eq('id', booking.service_provider_id)
            .single();

          if (serviceProvider?.user_id === user.id && booking.status === 'confirmed' && oldBooking.status !== 'confirmed') {
            console.log('BookingStatusManager: Provider confirmed booking', booking.id);
            toast({
              title: "Booking Accepted! 💬",
              description: "You've accepted the booking. You can now chat with your client.",
              action: (
                <button
                  onClick={() => navigate('/bookings')}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
                >
                  View Bookings
                </button>
              ),
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast, navigate]);

  return null; // This component only handles side effects
};