-- Fix public access to services and related data
-- This allows the app to display services to anonymous users

-- =============================================
-- SERVICES TABLE - Allow public read access
-- =============================================

-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "services_owner_access" ON public.services;
DROP POLICY IF EXISTS "services_provider_access" ON public.services;

-- Create public read policy for services
CREATE POLICY "services_public_read"
ON public.services
FOR SELECT
TO public
USING (is_active = true);

-- Authenticated users can manage their own services
CREATE POLICY "services_owner_access"
ON public.services
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
)
WITH CHECK (
  user_id = auth.uid() OR  
  auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
);

-- =============================================
-- SERVICE PROVIDERS TABLE - Allow public read
-- =============================================

-- Enable RLS on service_providers table
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "service_providers_public_read" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_own_access" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_admin_access" ON public.service_providers;

-- Allow public read access to service providers
CREATE POLICY "service_providers_public_read"
ON public.service_providers
FOR SELECT
TO public
USING (true);

-- Users can manage their own service provider record
CREATE POLICY "service_providers_own_access"
ON public.service_providers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- PROFILES TABLE - Allow public read for service listings
-- =============================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read all profiles" ON public.profiles;

-- Allow public read access to profiles (needed for service listings)
CREATE POLICY "profiles_public_read"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Users can manage their own profile
CREATE POLICY "profiles_own_access"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =============================================
-- JOB CATEGORIES - Allow public read
-- =============================================

-- Enable RLS on job_categories table
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "job_categories_public_read" ON public.job_categories;

-- Allow public read access to job categories
CREATE POLICY "job_categories_public_read"
ON public.job_categories
FOR SELECT
TO public
USING (true);

-- =============================================
-- SERVICE IMAGES - Allow public read
-- =============================================

-- Enable RLS on service_images table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_images') THEN
    ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "service_images_public_read" ON public.service_images;
    
    -- Allow public read access to service images
    CREATE POLICY "service_images_public_read"
    ON public.service_images
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to anonymous and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.service_providers TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.job_categories TO anon, authenticated;

-- Grant permissions for service_images if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_images') THEN
    GRANT SELECT ON public.service_images TO anon, authenticated;
  END IF;
END $$;

-- Grant full permissions to authenticated users on their own data
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.service_providers TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';