-- Fix booking creation and notification system with real-time chat
-- First, ensure the messages table has the correct structure for both booking-based messages and conversation-based messages

-- Drop and recreate messages table with proper structure
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table that supports booking-based chat
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = booking_id 
            AND (b.client_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.service_providers sp 
                WHERE sp.id = b.service_provider_id AND sp.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update message read status" ON public.messages
    FOR UPDATE USING (
        auth.uid() = recipient_id OR auth.uid() = sender_id
    ) WITH CHECK (
        auth.uid() = recipient_id OR auth.uid() = sender_id
    );

-- Function to create message notification (replaces the trigger from setup-chat-message-notifications.sql)
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  booking_info RECORD;
  service_info RECORD;
  service_details TEXT;
BEGIN
  -- Get sender profile information
  SELECT first_name, last_name INTO sender_profile
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Get booking information
  SELECT notes, service_id INTO booking_info
  FROM bookings 
  WHERE id = NEW.booking_id;
  
  -- Get service details if service_id exists
  service_details := COALESCE(booking_info.notes, 'Service booking');
  
  IF booking_info.service_id IS NOT NULL THEN
    SELECT description INTO service_info
    FROM services 
    WHERE id = booking_info.service_id;
    
    service_details := COALESCE(service_info.description, booking_info.notes, 'Service booking');
  END IF;
  
  -- Create notification for message recipient
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    is_read
  ) VALUES (
    NEW.recipient_id,
    'Nouveau message',
    CONCAT(COALESCE(sender_profile.first_name, ''), ' ', COALESCE(sender_profile.last_name, ''), ' vous a envoyé un message concernant: ', service_details),
    'info',
    NEW.booking_id,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Ensure notifications can be inserted by triggers
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow system to insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION create_message_notification() TO authenticated;

-- Set up realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Enable replica identity for real-time updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;