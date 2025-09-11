-- Fix profile photos storage setup
-- First, ensure the bucket exists with correct settings
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

-- Drop existing storage policies to recreate them correctly
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;

-- Create storage policies with simpler path checking
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '%'
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '%'
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '%'
);

CREATE POLICY "Profile photos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- Ensure profiles table has the column and proper policies
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Drop existing profile policies to recreate them
DROP POLICY IF EXISTS "Users can update their own profile photos" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profile photos" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policies for profiles table
CREATE POLICY "Users can update their own profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;