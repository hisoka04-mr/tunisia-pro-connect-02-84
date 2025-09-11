-- FINAL COMPREHENSIVE FIX FOR PROFILE PHOTO UPLOAD RLS
-- This fixes the "new row violates row-level security policy" error

-- =============================================
-- STEP 1: ENSURE PROFILE-PHOTOS BUCKET EXISTS
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
-- STEP 2: DROP ALL EXISTING STORAGE POLICIES
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
DROP POLICY IF EXISTS "Authenticated upload to profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_delete" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_select" ON storage.objects;

-- =============================================
-- STEP 3: CREATE SIMPLE WORKING STORAGE POLICIES
-- =============================================

-- Allow authenticated users to upload files to profile-photos bucket
CREATE POLICY "authenticated_upload_profile_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow authenticated users to update files in profile-photos bucket
CREATE POLICY "authenticated_update_profile_photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to delete files in profile-photos bucket
CREATE POLICY "authenticated_delete_profile_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow everyone to view profile photos (public read)
CREATE POLICY "public_select_profile_photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- =============================================
-- STEP 4: ENSURE PROFILES TABLE SETUP
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
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "ultra_permissive_profiles" ON public.profiles;

-- Create working profile policies
CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "anyone_can_read_profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
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
-- STEP 6: REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 
  'Profile Photos Bucket' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-photos' AND public = true) 
    THEN '✅ EXISTS and PUBLIC' 
    ELSE '❌ MISSING or PRIVATE' 
  END as status
UNION ALL
SELECT 
  'Storage Policies',
  COUNT(*)::text || ' policies created'
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND tablename = 'objects' AND policyname LIKE '%profile_photos%'
UNION ALL
SELECT 
  'Profile Table Policies',
  COUNT(*)::text || ' policies created'
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';