-- Create profile_pictures table for storing user profile images
CREATE TABLE public.profile_pictures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_profile_pictures_user_id ON profile_pictures(user_id);
CREATE INDEX idx_profile_pictures_active ON profile_pictures(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile pictures
CREATE POLICY "Users can view own profile pictures"
ON profile_pictures
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Anyone can view active profile pictures (for public display)
CREATE POLICY "Anyone can view active profile pictures"
ON profile_pictures
FOR SELECT
TO public
USING (is_active = true);

-- Users can insert their own profile pictures
CREATE POLICY "Users can insert own profile pictures"
ON profile_pictures
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile pictures
CREATE POLICY "Users can update own profile pictures"
ON profile_pictures
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile pictures
CREATE POLICY "Users can delete own profile pictures"
ON profile_pictures
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to sync profile pictures with profiles and service_providers tables
CREATE OR REPLACE FUNCTION sync_profile_picture_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for syncing profile pictures
CREATE TRIGGER trigger_sync_profile_picture_url
  AFTER INSERT OR UPDATE OR DELETE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_picture_url();

-- Add updated_at trigger
CREATE TRIGGER trigger_profile_pictures_updated_at
  BEFORE UPDATE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();