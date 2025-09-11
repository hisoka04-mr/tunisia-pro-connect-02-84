-- Profile photos end-to-end setup
-- 1) Ensure profiles has profile_photo_url and signup trigger stores it

-- Add column for profile photo URL
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Recreate signup trigger function to also store profile_photo_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, profile_photo_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    -- Prefer explicit profile_photo_url from metadata, else avatar_url, else NULL
    COALESCE(NEW.raw_user_meta_data ->> 'profile_photo_url', NEW.raw_user_meta_data ->> 'avatar_url')
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    phone      = EXCLUDED.phone,
    profile_photo_url = COALESCE(EXCLUDED.profile_photo_url, public.profiles.profile_photo_url);
  RETURN NEW;
END;
$$;

-- 2) Keep service_providers.profile_photo_url in sync with profiles.profile_photo_url
-- Create function and trigger for sync
CREATE OR REPLACE FUNCTION public.sync_profile_photo_to_service_providers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a user's profile photo changes, propagate to their service_provider row if it exists
  UPDATE public.service_providers sp
  SET profile_photo_url = NEW.profile_photo_url,
      updated_at = now()
  WHERE sp.user_id = NEW.id
    AND (sp.profile_photo_url IS DISTINCT FROM NEW.profile_photo_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_photo ON public.profiles;
CREATE TRIGGER trg_sync_profile_photo
AFTER UPDATE OF profile_photo_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_photo_to_service_providers();

-- 3) One-time backfill to sync existing photos from profiles -> service_providers
UPDATE public.service_providers sp
SET profile_photo_url = p.profile_photo_url,
    updated_at = now()
FROM public.profiles p
WHERE sp.user_id = p.id
  AND (sp.profile_photo_url IS DISTINCT FROM p.profile_photo_url);

-- 4) Ensure RLS remains safe (no policy changes needed here as functions are SECURITY DEFINER)
-- Note: Storage bucket 'profile-photos' already exists per project config.
