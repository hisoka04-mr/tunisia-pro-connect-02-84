-- Complete Profile Photo Storage and RLS Fix
-- This script ensures profile photos work end-to-end: upload, save, and display

-- =============================================
-- STORAGE BUCKET SETUP
-- =============================================

-- Create or update profile-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- =============================================
-- CLEAN UP EXISTING STORAGE POLICIES
-- =============================================

-- Drop all existing storage policies for profile-photos bucket
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;

-- =============================================
-- CREATE STORAGE POLICIES
-- =============================================

-- Policy 1: Authenticated users can upload their own profile photos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '%'
);

-- Policy 2: Authenticated users can update their own profile photos
CREATE POLICY "Authenticated users can update profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '%'
);

-- Policy 3: Authenticated users can delete their own profile photos
CREATE POLICY "Authenticated users can delete profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '%'
);

-- Policy 4: Anyone can view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- =============================================
-- ENSURE TABLE STRUCTURE
-- =============================================

-- Ensure profiles table has profile_photo_url column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Ensure service_providers table has profile_photo_url column
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- =============================================
-- CLEAN UP EXISTING TABLE POLICIES
-- =============================================

-- Temporarily disable RLS to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_full_access" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_all_access" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view profile photos" ON profiles;

DROP POLICY IF EXISTS "service_providers_own_management" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;

-- =============================================
-- CREATE HELPER FUNCTIONS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.email() IN (
    'admin@sevigo.com',
    'admin@admin.com', 
    'support@sevigo.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CREATE TABLE POLICIES
-- =============================================

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Policy 1: Users can update their own profile (including profile_photo_url)
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Anyone can view profiles (needed for service listings and public display)
CREATE POLICY "Anyone can view profiles"
ON profiles
FOR SELECT
TO public
USING (true);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can do everything on profiles
CREATE POLICY "Admins full access to profiles"
ON profiles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Service providers table policies
-- Policy 1: Users can manage their own service provider record
CREATE POLICY "Users can manage own service provider"
ON service_providers
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR is_admin())
WITH CHECK (user_id = auth.uid() OR is_admin());

-- Policy 2: Anyone can view service providers (for public listings)
CREATE POLICY "Anyone can view service providers"
ON service_providers
FOR SELECT
TO public
USING (true);

-- =============================================
-- SYNC FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to sync profile photos between profiles and service_providers
CREATE OR REPLACE FUNCTION sync_profile_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When profiles.profile_photo_url changes, update service_providers
  IF TG_TABLE_NAME = 'profiles' THEN
    UPDATE service_providers 
    SET profile_photo_url = NEW.profile_photo_url,
        updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
  END IF;
  
  -- When service_providers.profile_photo_url changes, update profiles
  IF TG_TABLE_NAME = 'service_providers' THEN
    UPDATE profiles 
    SET profile_photo_url = NEW.profile_photo_url,
        updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for syncing (drop existing first)
DROP TRIGGER IF EXISTS trigger_sync_profile_photo_from_profiles ON profiles;
CREATE TRIGGER trigger_sync_profile_photo_from_profiles
  AFTER UPDATE OF profile_photo_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_photo();

DROP TRIGGER IF EXISTS trigger_sync_profile_photo_from_service_providers ON service_providers;
CREATE TRIGGER trigger_sync_profile_photo_from_service_providers
  AFTER UPDATE OF profile_photo_url ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_photo();

-- =============================================
-- ENSURE SERVICES TABLE RELATIONSHIPS
-- =============================================

-- Ensure services table has user_id column for proper linking
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create function to ensure user_id is set correctly on services
CREATE OR REPLACE FUNCTION ensure_service_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id is not set, get it from the service_provider
  IF NEW.user_id IS NULL AND NEW.service_provider_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id 
    FROM service_providers 
    WHERE id = NEW.service_provider_id;
  END IF;
  
  -- If still null, use the authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure user_id is set on services
DROP TRIGGER IF EXISTS trigger_ensure_service_user_id ON public.services;
CREATE TRIGGER trigger_ensure_service_user_id
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION ensure_service_user_id();

-- Update existing services that might be missing user_id
UPDATE services 
SET user_id = sp.user_id
FROM service_providers sp
WHERE services.service_provider_id = sp.id 
AND services.user_id IS NULL;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON service_providers TO authenticated;
GRANT SELECT ON service_providers TO anon;
GRANT ALL ON services TO authenticated;
GRANT SELECT ON services TO anon;

-- Grant storage permissions
GRANT SELECT ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;

-- =============================================
-- CREATE PERFORMANCE INDEXES
-- =============================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_photo_url ON profiles(profile_photo_url) WHERE profile_photo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_providers_profile_photo_url ON service_providers(profile_photo_url) WHERE profile_photo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';