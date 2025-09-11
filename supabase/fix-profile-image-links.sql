-- Fix profile image linking between services and users
-- This ensures services.user_id properly links to profiles.profile_photo_url

-- Ensure profiles table has profile_photo_url (should already exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Ensure services table has user_id column
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create function to sync profile photos from profiles to service_providers
CREATE OR REPLACE FUNCTION public.sync_profile_photo_to_service_providers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a user's profile photo changes, update their service_provider record
  UPDATE service_providers 
  SET profile_photo_url = NEW.profile_photo_url,
      updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync profile photos
DROP TRIGGER IF EXISTS trigger_sync_profile_photo ON public.profiles;
CREATE TRIGGER trigger_sync_profile_photo
  AFTER UPDATE OF profile_photo_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_photo_to_service_providers();

-- Create function to ensure user_id is set correctly on services
CREATE OR REPLACE FUNCTION public.ensure_service_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id is not set, get it from the service_provider
  IF NEW.user_id IS NULL AND NEW.service_provider_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id 
    FROM service_providers 
    WHERE id = NEW.service_provider_id;
  END IF;
  
  -- If still null, use the authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure user_id is set on services
DROP TRIGGER IF EXISTS trigger_ensure_service_user_id ON public.services;
CREATE TRIGGER trigger_ensure_service_user_id
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION ensure_service_user_id();

-- Update existing services that might be missing user_id
UPDATE services 
SET user_id = sp.user_id
FROM service_providers sp
WHERE services.service_provider_id = sp.id 
AND services.user_id IS NULL;

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_photo_url ON profiles(profile_photo_url) WHERE profile_photo_url IS NOT NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON services TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON service_providers TO authenticated;