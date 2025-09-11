-- Fix RLS policies for service providers to allow proper access

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own service provider profile" ON public.service_providers;
DROP POLICY IF EXISTS "Public can view approved service providers" ON public.service_providers;

-- Create comprehensive policies for service_providers table
CREATE POLICY "Service providers can view their own profile" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved service providers" 
ON public.service_providers 
FOR SELECT 
USING (is_approved = true);

-- Ensure service providers can read their own records for service operations
CREATE POLICY "Service providers can read own record for service operations" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix services table policies to ensure proper access
DROP POLICY IF EXISTS "Users can view all services" ON public.services;

-- Ensure the services policies work correctly
DROP POLICY IF EXISTS "Service providers can insert their own services" ON public.services;
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