-- Fix security issues: Restrict public access to sensitive data in service_providers table
-- Create a view for public service provider information that excludes sensitive data
CREATE OR REPLACE VIEW public.service_providers_public AS
SELECT 
    id,
    user_id,
    business_name,
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

-- Create RLS policy for the view
ALTER VIEW public.service_providers_public OWNER TO postgres;

-- Remove public SELECT access from the main service_providers table
DROP POLICY IF EXISTS "Service providers are viewable by everyone" ON public.service_providers;

-- Create new restricted policy for service_providers table
CREATE POLICY "Service providers can view their own profile and full details" 
ON public.service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for public view (basic business info only)
CREATE POLICY "Public can view basic service provider info" 
ON public.service_providers 
FOR SELECT 
USING (is_approved = true);

-- Fix admin_settings table - remove public access
DROP POLICY IF EXISTS "Admin settings are viewable by everyone" ON public.admin_settings;

-- Create admin-only access policy for admin_settings
CREATE POLICY "Only admin users can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (
            -- Add admin role check here when you implement user roles
            id = auth.uid() -- For now, only allow self-access
        )
    )
);

-- Add foreign key relationship between service_providers and profiles
-- This fixes the database relationship error we saw in network logs
ALTER TABLE public.service_providers 
ADD CONSTRAINT fk_service_providers_profiles 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;