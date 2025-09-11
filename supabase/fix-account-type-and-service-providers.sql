-- Fix account type system and service providers table
-- This fixes the missing business_name column and ensures proper account type management

-- 1. First ensure profiles table has account_type column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'client' 
CHECK (account_type IN ('client', 'onsite_provider', 'online_provider'));

-- 2. Fix service_providers table with all required columns
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'My Business',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;

-- 3. Create function to automatically update account type when service provider is created
CREATE OR REPLACE FUNCTION update_account_type_on_service_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's account type in profiles table
  UPDATE profiles 
  SET account_type = CASE 
    WHEN NEW.service_type = 'onsite' THEN 'onsite_provider'
    WHEN NEW.service_type = 'online' THEN 'online_provider'
    ELSE 'onsite_provider' -- default fallback
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger on service_providers table
DROP TRIGGER IF EXISTS trigger_update_account_type_on_service_provider ON service_providers;
CREATE TRIGGER trigger_update_account_type_on_service_provider
  AFTER INSERT ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_account_type_on_service_provider();

-- 5. Also create trigger on services table to update account type
CREATE OR REPLACE FUNCTION update_account_type_on_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's account type in profiles table based on service type
  UPDATE profiles 
  SET account_type = CASE 
    WHEN NEW.service_type = 'onsite' THEN 'onsite_provider'
    WHEN NEW.service_type = 'online' THEN 'online_provider'
    ELSE 'onsite_provider' -- default fallback
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_account_type_on_service ON services;
CREATE TRIGGER trigger_update_account_type_on_service
  AFTER INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_account_type_on_service();

-- 6. Update existing users who have posted services to have correct account type
UPDATE profiles 
SET account_type = CASE 
  WHEN EXISTS (
    SELECT 1 FROM services s 
    WHERE s.user_id = profiles.id 
    AND s.service_type = 'online'
  ) THEN 'online_provider'
  WHEN EXISTS (
    SELECT 1 FROM services s 
    WHERE s.user_id = profiles.id 
    AND s.service_type = 'onsite'
  ) THEN 'onsite_provider'
  WHEN EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.user_id = profiles.id
  ) THEN 'onsite_provider'
  ELSE account_type
END
WHERE account_type = 'client' 
AND (
  EXISTS (SELECT 1 FROM services WHERE user_id = profiles.id) 
  OR EXISTS (SELECT 1 FROM service_providers WHERE user_id = profiles.id)
);

-- 7. Fix any existing service_providers that might not have business_name
UPDATE service_providers 
SET business_name = COALESCE(business_name, 'My Business')
WHERE business_name IS NULL OR business_name = '';

-- 8. Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON service_providers TO authenticated;
GRANT ALL ON services TO authenticated;

-- 9. Refresh schema cache
NOTIFY pgrst, 'reload schema';