-- Add profile_photo_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.profiles.profile_photo_url IS 'URL of the user profile photo stored in Supabase Storage';

-- Create a policy to allow users to update their own profile photos
CREATE POLICY IF NOT EXISTS "Users can update their own profile photos"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create a policy to allow public read access to profile photos
CREATE POLICY IF NOT EXISTS "Public can view profile photos"
ON public.profiles
FOR SELECT
USING (true);