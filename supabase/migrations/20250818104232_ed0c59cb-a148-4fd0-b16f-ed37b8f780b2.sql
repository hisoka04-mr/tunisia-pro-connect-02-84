-- Create bookings table for appointment management
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_hours INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    total_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table for ratings and feedback
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(booking_id)
);

-- Create messages table for communication
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read BOOLEAN DEFAULT false,
    related_id UUID, -- Can reference bookings, reviews, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service_images table for multiple images per service
CREATE TABLE public.service_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create availability table for service provider schedules
CREATE TABLE public.availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(service_provider_id, day_of_week, start_time)
);

-- Create payments table for transaction records
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'TND',
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_payment')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_settings table for site configuration
CREATE TABLE public.admin_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to existing tables
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS availability_notes TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Enable Row Level Security on all new tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() IN (SELECT user_id FROM public.service_providers WHERE id = service_provider_id)
);

CREATE POLICY "Clients can create bookings" ON public.bookings
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
FOR UPDATE USING (
    auth.uid() = client_id OR 
    auth.uid() IN (SELECT user_id FROM public.service_providers WHERE id = service_provider_id)
);

-- Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
FOR SELECT USING (true);

CREATE POLICY "Clients can create reviews for their bookings" ON public.reviews
FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND client_id = auth.uid() AND status = 'completed')
);

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received" ON public.messages
FOR UPDATE USING (auth.uid() = recipient_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for service_images
CREATE POLICY "Service images are viewable by everyone" ON public.service_images
FOR SELECT USING (true);

CREATE POLICY "Service providers can manage their service images" ON public.service_images
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.services s 
        JOIN public.service_providers sp ON s.service_provider_id = sp.id 
        WHERE s.id = service_id AND sp.user_id = auth.uid()
    )
);

-- Create RLS policies for availability
CREATE POLICY "Availability is viewable by everyone" ON public.availability
FOR SELECT USING (true);

CREATE POLICY "Service providers can manage their availability" ON public.availability
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.service_providers WHERE id = service_provider_id AND user_id = auth.uid())
);

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
FOR SELECT USING (
    auth.uid() IN (
        SELECT b.client_id FROM public.bookings b WHERE b.id = booking_id
        UNION
        SELECT sp.user_id FROM public.bookings b 
        JOIN public.service_providers sp ON b.service_provider_id = sp.id 
        WHERE b.id = booking_id
    )
);

-- Create RLS policies for admin_settings (admin only)
CREATE POLICY "Admin settings are viewable by everyone" ON public.admin_settings
FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_service_provider_id ON public.bookings(service_provider_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_reviews_service_provider_id ON public.reviews(service_provider_id);
CREATE INDEX idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX idx_service_images_service_id ON public.service_images(service_id);
CREATE INDEX idx_availability_provider_day ON public.availability(service_provider_id, day_of_week);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update service provider ratings
CREATE OR REPLACE FUNCTION public.update_service_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.service_providers 
    SET 
        rating = (SELECT AVG(rating) FROM public.reviews WHERE service_provider_id = NEW.service_provider_id),
        total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE service_provider_id = NEW.service_provider_id)
    WHERE id = NEW.service_provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_rating_on_review
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_service_provider_rating();

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
('site_name', '"TechPro Tunisia"', 'The name of the website'),
('commission_rate', '0.15', 'Commission rate for bookings (15%)'),
('currency', '"TND"', 'Default currency'),
('booking_advance_days', '7', 'Days in advance bookings can be made'),
('cancellation_hours', '24', 'Hours before booking that cancellation is allowed'),
('max_images_per_service', '5', 'Maximum number of images per service')
ON CONFLICT (setting_key) DO NOTHING;