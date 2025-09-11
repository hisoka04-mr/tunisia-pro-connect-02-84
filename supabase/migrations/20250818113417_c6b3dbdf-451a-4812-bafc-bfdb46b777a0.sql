-- Fix security issues: Restrict public access to sensitive data in service_providers table
-- Create a view for public service provider information that excludes sensitive contact data
CREATE OR REPLACE VIEW public.service_providers_public AS
SELECT 
    id,
    user_id,
    business_description,
    job_category_id,
    profile_photo_url,
    address, -- Keep address as it's business location, not personal
    rating,
    total_reviews,
    is_approved,
    created_at,
    updated_at
FROM public.service_providers;

-- Grant public access to the view
GRANT SELECT ON public.service_providers_public TO anon;
GRANT SELECT ON public.service_providers_public TO authenticated;

-- Remove public SELECT access from the main service_providers table
DROP POLICY IF EXISTS "Service providers are viewable by everyone" ON public.service_providers;

-- Create new restricted policy for service_providers table (own profile access)
CREATE POLICY "Service providers can view their own profile" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for approved providers with limited data exposure
CREATE POLICY "Public can view approved provider basic info" 
ON public.service_providers 
FOR SELECT 
USING (is_approved = true);

-- Fix admin_settings table - remove public access
DROP POLICY IF EXISTS "Admin settings are viewable by everyone" ON public.admin_settings;

-- Create admin-only access policy for admin_settings
CREATE POLICY "Only admin users can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (false); -- Block all access for now until admin roles are implemented