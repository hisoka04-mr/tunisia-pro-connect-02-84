-- Complete Chat System Fix
-- This file fixes all chat-related database issues and ensures proper functionality

-- =============================================
-- DROP EXISTING CHAT TABLES TO RECREATE PROPERLY
-- =============================================

-- Drop existing tables in correct order to avoid dependency issues
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- =============================================
-- CREATE PROPER CHAT TABLES
-- =============================================

-- Create conversations table (chat rooms between users for specific bookings)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(booking_id) -- One conversation per booking
);

-- Create messages table (individual messages within conversations)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON public.conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_service_provider_id ON public.conversations(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update conversation timestamp when new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET updated_at = now() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation timestamp
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to create conversation when booking is confirmed
CREATE OR REPLACE FUNCTION create_conversation_on_booking_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create conversation when booking status changes to confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        INSERT INTO public.conversations (booking_id, service_provider_id, client_id)
        VALUES (NEW.id, NEW.service_provider_id, NEW.client_id)
        ON CONFLICT (booking_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create conversation on booking confirmation
DROP TRIGGER IF EXISTS create_conversation_trigger ON public.bookings;
CREATE TRIGGER create_conversation_trigger
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_on_booking_confirmation();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations for confirmed bookings" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() = service_provider_id OR 
        auth.uid() = client_id
    );

CREATE POLICY "Users can create conversations for confirmed bookings" ON public.conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id 
            AND status = 'confirmed'
            AND (service_provider_id = auth.uid() OR client_id = auth.uid())
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (service_provider_id = auth.uid() OR client_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (service_provider_id = auth.uid() OR client_id = auth.uid())
        )
    );

CREATE POLICY "Users can update read status" ON public.messages
    FOR UPDATE USING (
        recipient_id = auth.uid() OR sender_id = auth.uid()
    ) WITH CHECK (
        recipient_id = auth.uid() OR sender_id = auth.uid()
    );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION create_conversation_on_booking_confirmation() TO authenticated;

-- =============================================
-- CREATE SAMPLE CONVERSATIONS FOR EXISTING CONFIRMED BOOKINGS
-- =============================================

-- Create conversations for any existing confirmed bookings that don't have conversations yet
INSERT INTO public.conversations (booking_id, service_provider_id, client_id)
SELECT 
    b.id as booking_id,
    b.service_provider_id,
    b.client_id
FROM public.bookings b
WHERE b.status = 'confirmed'
AND NOT EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.booking_id = b.id
)
ON CONFLICT (booking_id) DO NOTHING;