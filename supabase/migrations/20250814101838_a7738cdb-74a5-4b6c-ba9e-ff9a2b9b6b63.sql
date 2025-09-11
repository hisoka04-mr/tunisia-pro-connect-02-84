-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('client', 'service_provider')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create job categories table
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_medical BOOLEAN DEFAULT false,
  requires_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for job categories (public read access)
CREATE POLICY "Job categories are viewable by everyone" 
ON public.job_categories 
FOR SELECT 
USING (true);

-- Create service providers table
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  job_category_id UUID NOT NULL REFERENCES public.job_categories(id),
  business_name TEXT NOT NULL,
  description TEXT,
  experience_years INTEGER,
  hourly_rate DECIMAL(10,2),
  profile_photo_url TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'inactive', 'suspended')) DEFAULT 'trial',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN DEFAULT false,
  license_number TEXT,
  license_verified BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Create policies for service providers
CREATE POLICY "Service providers are viewable by everyone when approved" 
ON public.service_providers 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Users can view their own service provider profile" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own service provider profile" 
ON public.service_providers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service provider profile" 
ON public.service_providers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Create storage policies for profile photos
CREATE POLICY "Profile photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, phone, user_type)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default job categories
INSERT INTO public.job_categories (name, description, is_medical, requires_subscription) VALUES
('General Medicine', 'General practitioners and family doctors', true, true),
('Veterinary Medicine', 'Animal doctors and veterinarians', true, true),
('Cardiology', 'Heart and cardiovascular specialists', true, false),
('Dermatology', 'Skin and dermatological specialists', true, false),
('Neurology', 'Brain and nervous system specialists', true, false),
('Pediatrics', 'Child healthcare specialists', true, false),
('Psychiatry', 'Mental health specialists', true, false),
('Orthopedics', 'Bone and joint specialists', true, false),
('Gynecology', 'Women''s health specialists', true, false),
('Ophthalmology', 'Eye care specialists', true, false),
('Plumbing', 'Plumbing and water systems', false, false),
('Electrical', 'Electrical installations and repairs', false, false),
('Cleaning', 'Cleaning and maintenance services', false, false),
('Tutoring', 'Educational and tutoring services', false, false);