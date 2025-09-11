-- Fix search_path security issues for profile picture functions
CREATE OR REPLACE FUNCTION sync_profile_picture_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new profile picture is added or updated, sync with profiles table
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Mark other pictures as inactive
    UPDATE profile_pictures 
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;
    
    -- Update profiles table
    UPDATE profiles 
    SET profile_photo_url = NEW.image_url, updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Update service_providers table
    UPDATE service_providers 
    SET profile_photo_url = NEW.image_url, updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
  END IF;
  
  -- When a profile picture is deleted, clear the URLs if it was active
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_active = true THEN
      UPDATE profiles 
      SET profile_photo_url = NULL, updated_at = now()
      WHERE id = OLD.user_id;
      
      UPDATE service_providers 
      SET profile_photo_url = NULL, updated_at = now()
      WHERE user_id = OLD.user_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;