-- COMPLETE PROFILE PHOTO RLS FIX
-- This addresses all Storage RLS policy issues for profile photo uploads

-- =============================================
-- STEP 1: ENSURE PROFILE PHOTOS BUCKET EXISTS AND IS PUBLIC
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
-- STEP 2: REMOVE ALL EXISTING STORAGE POLICIES
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
DROP POLICY IF EXISTS "profile_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_delete" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "upload_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "update_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "delete_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "view_profile_photos" ON storage.objects;

-- =============================================
-- STEP 3: CREATE SIMPLE, PERMISSIVE STORAGE POLICIES
-- =============================================

-- Allow any authenticated user to upload to profile-photos bucket
CREATE POLICY "authenticated_upload_profile_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Allow any authenticated user to update files in profile-photos bucket
CREATE POLICY "authenticated_update_profile_photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow any authenticated user to delete files in profile-photos bucket
CREATE POLICY "authenticated_delete_profile_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow everyone (including anonymous) to view profile photos (public bucket)
CREATE POLICY "public_read_profile_photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- =============================================
-- STEP 4: ENSURE PROFILES TABLE HAS PHOTO COLUMN
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- =============================================
-- STEP 5: FIX PROFILES TABLE POLICIES
-- =============================================

-- Remove existing profile policies that might conflict
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

-- Create working profile policies
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: GRANT ALL NECESSARY PERMISSIONS
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
-- STEP 7: REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Check that everything is set up correctly
SELECT 
  'Profile photos bucket exists' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-photos' AND public = true) 
    THEN 'OK - Public bucket exists' 
    ELSE 'ERROR - Bucket missing or not public' 
  END as status
UNION ALL
SELECT 
  'Storage policies for profile-photos',
  COUNT(*)::text || ' policies created'
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%profile_photos%'
UNION ALL
SELECT 
  'Profile table policies',
  COUNT(*)::text || ' policies created'
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';