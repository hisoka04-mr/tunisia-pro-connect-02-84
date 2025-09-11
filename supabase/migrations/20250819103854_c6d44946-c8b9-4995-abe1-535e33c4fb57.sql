-- Fix RLS policies to allow service providers to post services properly

-- Drop all existing policies for service_providers to start fresh
DROP POLICY IF EXISTS "Service providers can view their own profile" ON public.service_providers;
DROP POLICY IF EXISTS "Anyone can view approved service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Service providers can read own record for service operations" ON public.service_providers;
DROP POLICY IF EXISTS "Users can insert their own service provider profile" ON public.service_providers;
DROP POLICY IF EXISTS "Users can update their own service provider profile" ON public.service_providers;

-- Create comprehensive policies for service_providers table
-- Allow users to view their own service provider profile
CREATE POLICY "Users can view their own service provider profile" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow anyone to view approved service providers (for public browsing)
CREATE POLICY "Public can view approved service providers" 
ON public.service_providers 
FOR SELECT 
USING (is_approved = true);

-- Allow users to insert their own service provider profile
CREATE POLICY "Users can insert their own service provider profile" 
ON public.service_providers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own service provider profile
CREATE POLICY "Users can update their own service provider profile" 
ON public.service_providers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Now fix the services table policies
-- Drop existing services policies
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Service providers can update their own services" ON public.services;
DROP POLICY IF EXISTS "Service providers can delete their own services" ON public.services;
DROP POLICY IF EXISTS "Service providers can insert their own services" ON public.services;

-- Create new comprehensive policies for services
-- Allow everyone to view active services
CREATE POLICY "Everyone can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Allow service providers to view all their own services (active and inactive)
CREATE POLICY "Service providers can view their own services" 
ON public.services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers 
    WHERE id = service_provider_id 
    AND user_id = auth.uid()
  )
);

-- Allow service providers to insert their own services
CREATE POLICY "Service providers can insert their own services" 
ON public.services 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_providers 
    WHERE id = service_provider_id 
    AND user_id = auth.uid()
  )
);

-- Allow service providers to update their own services
CREATE POLICY "Service providers can update their own services" 
ON public.services 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers 
    WHERE id = service_provider_id 
    AND user_id = auth.uid()
  )
);

-- Allow service providers to delete their own services
CREATE POLICY "Service providers can delete their own services" 
ON public.services 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.service_providers 
    WHERE id = service_provider_id 
    AND user_id = auth.uid()
  )
);