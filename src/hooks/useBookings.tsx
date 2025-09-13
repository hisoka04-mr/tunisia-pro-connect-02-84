import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { emailTemplates } from "@/utils/emailTemplates";

export interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  client_id: string;
  service_id: string | null;
  service_provider_id: string;
  status: string | null;
  notes: string | null;
  duration_hours: number | null;
  total_price: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BookingWithDetails extends Booking {
  client_name?: string;
  service_name?: string;
  provider_name?: string;
}

export const useBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  // Create a new booking
  const createBooking = async (bookingData: {
    booking_date: string;
    booking_time: string;
    service_provider_id: string;
    service_id?: string;
    notes?: string;
    duration_hours?: number;
    total_price?: number;
  }) => {
    console.log("🏗️ useBookings createBooking called with:", bookingData);
    
    if (!user) {
      console.log("❌ No authenticated user found");
      toast({
        title: "Authentication required",
        description: "Please log in to book a service",
        variant: "destructive",
      });
      return null;
    }

    console.log("👤 Current user ID:", user.id);

    try {
      setLoading(true);

      console.log("🔄 Inserting booking into database...");
      
      // Normalize date and time to match Postgres types
      const normalizeTime = (t: string) => {
        try {
          const trimmed = t?.trim();
          if (!trimmed) return t;
          // h:mm[:ss] AM/PM
          const ampm = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
          if (ampm) {
            let h = parseInt(ampm[1], 10);
            const m = ampm[2];
            const s = ampm[3] || '00';
            const period = ampm[4].toUpperCase();
            if (period === 'PM' && h < 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${m}:${s}`;
          }
          // HH:mm or HH:mm:ss
          const hhmm = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
          if (hhmm) {
            const h = String(parseInt(hhmm[1], 10)).padStart(2, '0');
            const m = hhmm[2];
            const s = hhmm[3] || '00';
            return `${h}:${m}:${s}`;
          }
          return trimmed; // fallback
        } catch {
          return t;
        }
      };

      const normalizedDate = bookingData.booking_date?.includes('T')
        ? bookingData.booking_date.split('T')[0]
        : bookingData.booking_date;
      const normalizedTime = normalizeTime(bookingData.booking_time);

      const bookingInsertData = {
        ...bookingData,
        booking_date: normalizedDate,
        booking_time: normalizedTime,
        client_id: user.id,
        status: "pending",
      } as const;
      console.log("📝 Final booking insert data:", bookingInsertData);

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingInsertData)
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Database error creating booking:', bookingError);
        console.error('❌ Error details:', {
          message: bookingError.message,
          details: bookingError.details,
          hint: bookingError.hint,
          code: bookingError.code
        });
        throw bookingError;
      }

      console.log('✅ Booking created successfully in database:', booking);

      toast({
        title: "✅ Réservation créée avec succès",
        description: "Le prestataire a été notifié de votre demande de réservation",
      });

      return booking;
    } catch (error) {
      console.error("❌ Unexpected error creating booking:", error);
      toast({
        title: "Error creating booking",
        description: "Please try again later",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send email notification
  const sendEmailNotification = async (
    to: string,
    subject: string,
    html: string,
    notificationType: 'booking_request' | 'booking_update'
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: { to, subject, html, notificationType }
      });
      
      if (error) {
        console.error('Error sending email:', error);
      }
    } catch (error) {
      console.error('Error invoking email function:', error);
    }
  };

  // Create notification for booking
  const createBookingNotification = async (serviceProviderId: string, bookingId: string) => {
    try {
      console.log(`🔔 Creating notification for provider: ${serviceProviderId}, booking: ${bookingId}`);
      
      // Get service provider user ID to ensure we notify the right user
      const { data: serviceProviderData, error: spError } = await supabase
        .from("service_providers")
        .select("user_id")
        .eq("id", serviceProviderId)
        .single();

      if (spError) {
        console.error('❌ Error fetching service provider:', spError);
        throw new Error('Service provider not found');
      }

      const providerUserId = serviceProviderData.user_id;
      console.log('🎯 Notifying user ID:', providerUserId, 'for service provider ID:', serviceProviderId);

      // Get client information for more detailed notification
      let clientName = 'Un client';
      try {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user?.id)
          .single();
        
        if (clientProfile) {
          clientName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || 'Un client';
        }
      } catch (error) {
        console.log('Could not fetch client name, using default');
      }
      
      // Create in-app notification with more details
      console.log('🔔 Attempting to create notification for user:', providerUserId);
      const { data, error } = await supabase.from("notifications").insert({
        user_id: providerUserId, // Use the actual user_id from service_providers table
        title: "🔔 Nouvelle demande de réservation",
        message: `${clientName} souhaite réserver vos services. Consultez vos réservations pour accepter ou décliner.`,
        type: "booking_request",
        related_id: bookingId,
        is_read: false,
      }).select();

      if (error) {
        console.error("❌ Error inserting notification:", error);
        console.error("❌ Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log(`✅ Notification created successfully:`, data);
    } catch (error) {
      console.error("❌ Error creating notification:", error);
    }
  };

  // Update booking status (accept or decline)
  const updateBookingStatus = async (bookingId: string, status: "confirmed" | "declined") => {
    if (!user) return false;

    try {
      setLoading(true);

      // Get current user's service provider ID
      const { data: serviceProvider } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!serviceProvider) {
        throw new Error("Service provider not found");
      }

      // Get basic booking details first
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("service_provider_id", serviceProvider.id)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("service_provider_id", serviceProvider.id);

      if (error) throw error;

      // Get service provider name for notification
      let providerName = 'Service Provider';
      try {
        const { data: providerData, error: providerError } = await supabase
          .from("service_providers")
          .select("*")
          .eq("id", serviceProvider.id)
          .single();
        
        if (!providerError && providerData) {
          providerName = (providerData as any).business_name || 
                        (providerData as any).name || 
                        'Service Provider';
        }
      } catch (providerQueryError) {
        console.log("Could not fetch provider name, using default");
      }
      
      const bookingDate = new Date(booking.booking_date).toLocaleDateString();
      const bookingTime = booking.booking_time;

      // Create confirmation notification for client
      const notificationTitle = `🎉 Booking Confirmed!`;
      const notificationMessage = `Great news! ${providerName} has confirmed your booking on ${bookingDate} at ${bookingTime}. A chat room has been created so you can communicate directly with your service provider.`;

      // Create in-app notification for the client
      await supabase.from("notifications").insert({
        user_id: booking.client_id,
        title: notificationTitle,
        message: notificationMessage,
        type: "booking_update",
        related_id: bookingId,
        is_read: false,
      });

      console.log(`Confirmation notification sent to client ${booking.client_id} for booking ${bookingId}`);

      toast({
        title: `Booking confirmed`,
        description: `The booking has been confirmed successfully and the client has been notified`,
      });

      // Refresh bookings
      await fetchBookings();
      
      return true;
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error updating booking",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete booking (decline)
  const deleteBooking = async (bookingId: string) => {
    if (!user) return false;

    try {
      setLoading(true);

      // Get current user's service provider ID
      const { data: serviceProvider } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!serviceProvider) {
        throw new Error("Service provider not found");
      }

      // Get booking details first for notification
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("service_provider_id", serviceProvider.id)
        .single();

      if (fetchError) throw fetchError;

      // Get service provider name for notification
      let providerName = 'Service Provider';
      try {
        const { data: providerData, error: providerError } = await supabase
          .from("service_providers")
          .select("*")
          .eq("id", serviceProvider.id)
          .single();
        
        if (!providerError && providerData) {
          providerName = (providerData as any).business_name || 
                        (providerData as any).name || 
                        'Service Provider';
        }
      } catch (providerQueryError) {
        console.log("Could not fetch provider name, using default");
      }

      const bookingDate = new Date(booking.booking_date).toLocaleDateString();
      const bookingTime = booking.booking_time;

      // Create decline notification for client before deleting
      const notificationTitle = `📋 Booking Declined`;
      const notificationMessage = `${providerName} was unable to accommodate your booking request on ${bookingDate} at ${bookingTime}. You can search for other available providers or try a different time slot.`;

      await supabase.from("notifications").insert({
        user_id: booking.client_id,
        title: notificationTitle,
        message: notificationMessage,
        type: "booking_update",
        related_id: bookingId,
        is_read: false,
      });

      // Delete the booking
      const { error: deleteError } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId)
        .eq("service_provider_id", serviceProvider.id);

      if (deleteError) throw deleteError;

      console.log(`Booking ${bookingId} deleted and client ${booking.client_id} notified`);

      toast({
        title: "Booking declined",
        description: "The booking request has been removed and the client has been notified",
      });

      // Refresh bookings
      await fetchBookings();
      
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({
        title: "Error declining booking",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings for current user
  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First, get the service provider ID for current user
      const { data: serviceProvider } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const serviceProviderId = serviceProvider?.id;

      // Fetch bookings - as client or service provider
      let query = supabase
        .from("bookings")
        .select("*");

      if (serviceProviderId) {
        query = query.or(`client_id.eq.${user.id},service_provider_id.eq.${serviceProviderId}`);
      } else {
        query = query.eq("client_id", user.id);
      }

      const { data: bookingsData, error } = await query
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get client profiles and service details separately
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          let clientName = 'Unknown Client';
          let serviceName = 'Service';
          let providerName = 'Service Provider';

          // Get client profile
          if (booking.client_id) {
            try {
              const { data: clientProfile } = await supabase
                .from("profiles")
                .select("first_name, last_name")
                .eq("id", booking.client_id)
                .single();
              
              if (clientProfile) {
                clientName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || 'Unknown Client';
              }
            } catch (error) {
              console.log(`Could not fetch client profile for ${booking.client_id}`);
            }
          }

          // Get service details
          if (booking.service_id) {
            try {
              const { data: service } = await supabase
                .from("services")
                .select("business_name")
                .eq("id", booking.service_id)
                .single();
              
              if (service) {
                serviceName = service.business_name || 'Service';
              }
            } catch (error) {
              console.log(`Could not fetch service for ${booking.service_id}`);
            }
          }

          // Get provider details
          if (booking.service_provider_id) {
            try {
              const { data: provider } = await supabase
                .from("service_providers")
                .select("*")
                .eq("id", booking.service_provider_id)
                .single();
              
              if (provider) {
                // Handle different possible name fields
                providerName = (provider as any).business_name || 
                              (provider as any).name || 
                              'Service Provider';
              }
            } catch (error) {
              console.log(`Could not fetch provider for ${booking.service_provider_id}`);
            }
          }

          return {
            ...booking,
            client_name: clientName,
            service_name: serviceName,
            provider_name: providerName,
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error loading bookings",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings on mount and user change
  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  return {
    bookings,
    loading,
    createBooking,
    updateBookingStatus,
    deleteBooking,
    fetchBookings,
  };
};