import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 
  | 'info' 
  | 'warning' 
  | 'success' 
  | 'error' 
  | 'booking_request' 
  | 'booking_update' 
  | 'payment' 
  | 'system';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  relatedId?: string;
}

export const notificationService = {
  // Create a new notification
  async createNotification({
    userId,
    title,
    message,
    type = 'info',
    relatedId
  }: CreateNotificationParams) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { data: null, error };
    }
  },

  // Create booking request notification
  async createBookingRequestNotification(providerId: string, clientName: string, serviceDetails: string) {
    return this.createNotification({
      userId: providerId,
      title: 'New Booking Request',
      message: `${clientName} has requested to book your service: ${serviceDetails}`,
      type: 'booking_request'
    });
  },

  // Create booking confirmation notification
  async createBookingUpdateNotification(
    clientId: string, 
    status: 'confirmed' | 'declined', 
    serviceDetails: string
  ) {
    const title = status === 'confirmed' ? 'Booking Confirmed' : 'Booking Update';
    const message = status === 'confirmed' 
      ? `Your booking request for ${serviceDetails} has been confirmed!`
      : `Your booking request for ${serviceDetails} could not be accommodated at this time.`;

    return this.createNotification({
      userId: clientId,
      title,
      message,
      type: 'booking_update'
    });
  },

  // Create payment notification
  async createPaymentNotification(userId: string, amount: string, status: 'completed' | 'failed') {
    const title = status === 'completed' ? 'Payment Successful' : 'Payment Failed';
    const message = status === 'completed'
      ? `Your payment of ${amount} has been processed successfully.`
      : `Your payment of ${amount} could not be processed. Please try again.`;

    return this.createNotification({
      userId,
      title,
      message,
      type: 'payment'
    });
  },

  // Create new message notification
  async createNewMessageNotification(
    recipientId: string, 
    senderName: string, 
    serviceDetails: string,
    bookingId: string
  ) {
    return this.createNotification({
      userId: recipientId,
      title: 'Nouveau message',
      message: `${senderName} vous a envoyé un message concernant: ${serviceDetails}`,
      type: 'info', // Use 'info' instead of 'new_message' as it's not in the allowed types
      relatedId: bookingId
    });
  }
};