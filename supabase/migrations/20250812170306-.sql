-- Create job categories table
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default job categories
INSERT INTO public.job_categories (name, description) VALUES
  ('Plumber', 'Plumbing services and repairs'),
  ('Electrician', 'Electrical installations and repairs'),
  ('Carpenter', 'Woodwork and furniture services'),
  ('Mechanic', 'Vehicle repair and maintenance'),
  ('Painter', 'Interior and exterior painting'),
  ('Cleaner', 'Cleaning and maintenance services'),
  ('Gardener', 'Landscaping and garden maintenance'),
  ('HVAC Technician', 'Heating, ventilation, and air conditioning'),
  ('Handyman', 'General repair and maintenance'),
  ('Mason', 'Construction and masonry work');

-- Enable RLS on job categories (public read access)
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read job categories
CREATE POLICY "Anyone can view job categories" 
ON public.job_categories 
FOR SELECT 
USING (true);

-- Create service_providers table for additional provider info
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  job_category_id UUID REFERENCES public.job_categories(id),
  business_name TEXT,
  description TEXT,
  experience_years INTEGER,
  hourly_rate DECIMAL(10,2),
  profile_photo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_providers
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_providers
CREATE POLICY "Service providers can view their own profile" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service providers can update their own profile" 
ON public.service_providers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service providers can insert their own profile" 
ON public.service_providers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified service providers" 
ON public.service_providers 
FOR SELECT 
USING (is_verified = true);

-- Add trigger for updated_at
CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies for profile photos
CREATE POLICY "Users can upload their own profile photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

-- Add user_type to profiles table
ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'service_provider'));

-- Update the handle_new_user function to handle user types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, user_type)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';