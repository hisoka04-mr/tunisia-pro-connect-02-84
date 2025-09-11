-- FINAL FIX FOR PROFILE PHOTO UPLOAD SECURITY POLICIES
-- This resolves the "new row violates row-level security policy" error

-- =============================================
-- ENSURE PROFILE PHOTOS BUCKET EXISTS
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
-- DROP ALL EXISTING STORAGE POLICIES
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
DROP POLICY IF EXISTS "Authenticated upload to profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;

-- =============================================
-- CREATE SIMPLE WORKING STORAGE POLICIES
-- =============================================

-- Allow any authenticated user to upload to profile-photos bucket
CREATE POLICY "profile_photos_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow any authenticated user to update files in profile-photos bucket  
CREATE POLICY "profile_photos_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow any authenticated user to delete files in profile-photos bucket
CREATE POLICY "profile_photos_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow everyone to view profile photos (public bucket)
CREATE POLICY "profile_photos_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- =============================================
-- ENSURE PROFILES TABLE POLICIES ARE CORRECT
-- =============================================

-- Add profile_photo_url column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Drop existing profile policies that might conflict
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view profiles" ON public.profiles;

-- Create working profile policies
CREATE POLICY "profiles_user_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_public_select"
ON public.profiles
FOR SELECT
USING (true);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRANT NECESSARY PERMISSIONS  
-- =============================================
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON storage.buckets TO authenticated, anon;
GRANT SELECT ON storage.buckets TO authenticated, anon;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';