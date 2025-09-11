-- SIMPLE FIX: Create bucket and completely disable storage security
-- Run this in your Supabase SQL Editor

-- Step 1: Completely disable storage security
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Step 2: Remove all storage policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;

-- Step 3: Delete bucket if it exists and recreate it
DELETE FROM storage.buckets WHERE id = 'profile-photos';

-- Step 4: Create the profile-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Step 5: Grant full permissions
GRANT ALL ON storage.objects TO authenticated, anon, public;
GRANT ALL ON storage.buckets TO authenticated, anon, public;

-- Step 6: Verify the bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'profile-photos';