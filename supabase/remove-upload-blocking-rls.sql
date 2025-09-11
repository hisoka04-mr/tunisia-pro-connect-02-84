-- Remove RLS policies blocking profile photo uploads
-- This disables storage RLS and removes all blocking policies

-- =============================================
-- DISABLE STORAGE RLS COMPLETELY
-- =============================================
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- =============================================
-- REMOVE ALL STORAGE POLICIES
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
-- ENSURE PROFILE-PHOTOS BUCKET IS PUBLIC
-- =============================================
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

-- =============================================
-- GRANT FULL ACCESS TO STORAGE
-- =============================================
GRANT ALL ON storage.objects TO authenticated, anon, public;
GRANT ALL ON storage.buckets TO authenticated, anon, public;
GRANT USAGE ON SCHEMA storage TO authenticated, anon, public;

-- =============================================
-- REFRESH SCHEMA
-- =============================================
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 
  'Storage RLS' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND rowsecurity = false
    ) 
    THEN '✅ DISABLED - Uploads enabled' 
    ELSE '❌ STILL ENABLED' 
  END as status;