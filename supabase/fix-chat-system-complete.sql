-- Complete chat system fix - ensures proper message delivery and real-time updates
-- This fixes schema inconsistencies and ensures all users have profiles

-- First, ensure all users have profiles (this was causing "user not found" errors)
INSERT INTO public.profiles (id, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.created_at, now()),
    COALESCE(u.updated_at, now())
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Drop existing messages table to recreate with proper structure
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table with correct schema (booking-based chat, no conversations table needed)
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

-- Create indexes for better performance
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create RLS policies for messages
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Users can send messages for their bookings" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id 
            AND (client_id = auth.uid() OR service_provider_id IN (
                SELECT id FROM public.service_providers WHERE user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update read status of messages sent to them" ON public.messages
    FOR UPDATE USING (
        auth.uid() = recipient_id
    );

-- Create function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create function for real-time message notifications
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Perform notification in background (don't block message insert)
  PERFORM pg_notify(
    'new_message',
    json_build_object(
      'booking_id', NEW.booking_id,
      'recipient_id', NEW.recipient_id,
      'sender_id', NEW.sender_id,
      'message_id', NEW.id
    )::text
  );
  RETURN NEW;
END;
$$;

-- Create trigger for real-time notifications
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Clean up any existing messages that may have invalid references
DELETE FROM public.messages 
WHERE sender_id NOT IN (SELECT id FROM auth.users)
   OR recipient_id NOT IN (SELECT id FROM auth.users)
   OR booking_id NOT IN (SELECT id FROM public.bookings);

-- Grant necessary permissions
GRANT ALL ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_message() TO authenticated;