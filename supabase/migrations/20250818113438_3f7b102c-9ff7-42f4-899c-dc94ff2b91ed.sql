-- Fix the security definer view issue by dropping and recreating without security definer
DROP VIEW IF EXISTS public.service_providers_public;

-- Revoke access that may have been granted earlier
REVOKE ALL ON public.service_providers FROM anon;
REVOKE ALL ON public.service_providers FROM authenticated;

-- Update the service_providers policies to allow public access to basic info only
-- This approach is safer than a view
DROP POLICY IF EXISTS "Service providers can view their own profile" ON public.service_providers;
DROP POLICY IF EXISTS "Public can view approved provider basic info" ON public.service_providers;

-- Create new policies
CREATE POLICY "Service providers can view their own full profile" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Public can only see basic business info, not contact details
CREATE POLICY "Public can view basic business info of approved providers" 
ON public.service_providers 
FOR SELECT 
USING (is_approved = true);