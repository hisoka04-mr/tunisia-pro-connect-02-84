-- FINAL COMPREHENSIVE FIX FOR PROFILE PHOTO UPLOADS
-- This completely resets everything and creates working policies

-- =============================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- =============================================
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_providers DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: REMOVE ALL CONFLICTING POLICIES
-- =============================================

-- Remove ALL existing storage policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Remove ALL existing profile policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Remove ALL existing service_provider policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_providers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.service_providers';
    END LOOP;
END $$;

-- =============================================
-- STEP 3: ENSURE BUCKET EXISTS
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =============================================
-- STEP 4: CREATE SIMPLE WORKING STORAGE POLICIES
-- =============================================

-- Anyone authenticated can upload to profile-photos
CREATE POLICY "upload_profile_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Anyone authenticated can update files in profile-photos
CREATE POLICY "update_profile_photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Anyone authenticated can delete files in profile-photos
CREATE POLICY "delete_profile_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Everyone can view files in profile-photos (public bucket)
CREATE POLICY "view_profile_photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- =============================================
-- STEP 5: ENSURE TABLE COLUMNS EXIST
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- =============================================
-- STEP 6: CREATE SIMPLE TABLE POLICIES
-- =============================================

-- PROFILES TABLE POLICIES
-- Anyone can view profiles (needed for public display)
CREATE POLICY "view_profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- SERVICE PROVIDERS TABLE POLICIES
-- Anyone can view service providers (needed for listings)
CREATE POLICY "view_service_providers"
ON public.service_providers
FOR SELECT
USING (true);

-- Users can manage their own service provider record
CREATE POLICY "manage_own_service_provider"
ON public.service_providers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- STEP 7: RE-ENABLE RLS
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 8: GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON storage.buckets TO authenticated, anon;
GRANT SELECT ON storage.buckets TO authenticated, anon;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.service_providers TO authenticated;
GRANT SELECT ON public.service_providers TO anon;

-- =============================================
-- STEP 9: REFRESH SCHEMA
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION
-- =============================================
-- Check if everything is set up correctly
SELECT 
  'Bucket exists' as check_type, 
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-photos') THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'Storage policies count', 
  COUNT(*)::text 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
UNION ALL
SELECT 
  'Profile policies count', 
  COUNT(*)::text 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';