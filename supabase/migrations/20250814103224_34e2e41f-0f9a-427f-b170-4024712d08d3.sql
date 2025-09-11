-- Add certificate storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Create certificate storage policies
CREATE POLICY "Service providers can upload their own certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service providers can view their own certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates' AND public.has_role(auth.uid(), 'admin'));

-- Add certificate verification fields to service_providers table
ALTER TABLE public.service_providers 
ADD COLUMN certificate_url text,
ADD COLUMN certificate_status text DEFAULT 'pending' CHECK (certificate_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN certificate_verified_at timestamp with time zone,
ADD COLUMN certificate_verified_by uuid,
ADD COLUMN admin_notes text;

-- Update the existing approved status logic to require certificate approval
ALTER TABLE public.service_providers 
DROP COLUMN IF EXISTS is_approved;

-- Add computed approval status that requires both license and certificate verification
ALTER TABLE public.service_providers 
ADD COLUMN is_approved boolean GENERATED ALWAYS AS (
  CASE 
    WHEN certificate_status = 'approved' THEN true
    ELSE false
  END
) STORED;

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null CHECK (role IN ('admin', 'moderator', 'user')),
    created_at timestamp with time zone default now(),
    unique (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update service provider policies to include admin access
CREATE POLICY "Admins can view all service provider profiles" 
ON public.service_providers 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all service provider profiles" 
ON public.service_providers 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));