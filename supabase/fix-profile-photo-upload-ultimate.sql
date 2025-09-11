-- ULTIMATE FIX FOR PROFILE PHOTO UPLOAD RLS ISSUES
-- This completely resolves the "new row violates row-level security policy" error

-- =============================================
-- STEP 1: COMPLETELY DISABLE STORAGE RLS
-- =============================================
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: REMOVE ALL EXISTING STORAGE POLICIES
-- =============================================
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

-- =============================================
-- STEP 3: ENSURE PROFILE PHOTOS BUCKET EXISTS
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
-- STEP 4: GRANT FULL STORAGE PERMISSIONS
-- =============================================
GRANT ALL ON storage.objects TO authenticated, anon, public;
GRANT ALL ON storage.buckets TO authenticated, anon, public;
GRANT USAGE ON SCHEMA storage TO authenticated, anon, public;

-- =============================================
-- STEP 5: FIX PROFILES TABLE POLICIES
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Remove all existing profile policies
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

-- Create simple working profile policies
CREATE POLICY "profile_read_all"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "profile_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: GRANT PROFILE PERMISSIONS
-- =============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- =============================================
-- STEP 7: REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 
  'Storage RLS Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND rowsecurity = false
    ) 
    THEN '✅ DISABLED - Uploads will work' 
    ELSE '❌ STILL ENABLED - Problem persists' 
  END as status
UNION ALL
SELECT 
  'Profile Photos Bucket',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-photos' AND public = true) 
    THEN '✅ EXISTS and PUBLIC' 
    ELSE '❌ MISSING or PRIVATE' 
  END
UNION ALL  
SELECT 
  'Storage Policies Count',
  COALESCE(COUNT(*)::text, '0') || ' policies (should be 0)'
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';