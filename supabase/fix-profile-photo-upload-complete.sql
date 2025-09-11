
-- Complete fix for profile photo upload RLS issues
-- This completely resets and fixes all storage and profile policies

-- =============================================
-- DISABLE RLS TEMPORARILY FOR CLEANUP
-- =============================================
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- =============================================
-- ENSURE STORAGE BUCKET EXISTS AND IS PUBLIC
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =============================================
-- COMPLETELY REMOVE ALL EXISTING STORAGE POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone to view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public profile photos access" ON storage.objects;
DROP POLICY IF EXISTS "Everyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- =============================================
-- CREATE SIMPLE AND PERMISSIVE STORAGE POLICIES
-- =============================================

-- Allow any authenticated user to upload to profile-photos bucket
CREATE POLICY "Authenticated upload to profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow any authenticated user to update files in profile-photos bucket
CREATE POLICY "Authenticated update profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow any authenticated user to delete files in profile-photos bucket
CREATE POLICY "Authenticated delete profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow everyone (including anonymous) to view profile photos
CREATE POLICY "Public read profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- =============================================
-- FIX PROFILES TABLE POLICIES
-- =============================================

-- Ensure profile_photo_url column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Remove all existing profile policies
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users manage own profiles" ON public.profiles;

-- Create simple profile policies
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRANT ALL NECESSARY PERMISSIONS
-- =============================================

-- Grant storage permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON storage.buckets TO authenticated, anon;
GRANT SELECT ON storage.buckets TO authenticated, anon;

-- Grant profile permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION QUERIES (for testing)
-- =============================================
-- Uncomment these to test after running:
-- SELECT * FROM storage.buckets WHERE id = 'profile-photos';
-- SELECT policyname, cmd FROM storage.policies WHERE bucket_id = 'profile-photos';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';
