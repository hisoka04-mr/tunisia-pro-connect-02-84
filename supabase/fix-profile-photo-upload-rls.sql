-- Fix Profile Photo Upload RLS Issues
-- This addresses the "new row violates row-level security policy" error

-- =============================================
-- RECREATE STORAGE BUCKET WITH PROPER SETTINGS
-- =============================================

-- Update the profile-photos bucket to ensure it's public and has correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
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

-- =============================================
-- CREATE SIMPLE AND WORKING STORAGE POLICIES
-- =============================================

-- Allow authenticated users to upload files to profile-photos bucket
CREATE POLICY "Allow authenticated users to upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
);

-- Allow authenticated users to update their own profile photos
CREATE POLICY "Allow users to update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (owner = auth.uid() OR name LIKE auth.uid()::text || '%')
);

-- Allow authenticated users to delete their own profile photos
CREATE POLICY "Allow users to delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (owner = auth.uid() OR name LIKE auth.uid()::text || '%')
);

-- Allow everyone to view profile photos (public read)
CREATE POLICY "Allow everyone to view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- =============================================
-- ENSURE PROFILES TABLE RLS IS CORRECT
-- =============================================

-- Make sure profiles table has the column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

-- Create simple working policies for profiles table
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to view profiles"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';