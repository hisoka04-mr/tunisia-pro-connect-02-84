-- Fix Service Provider Linking Issues
-- This addresses the "provider not found" errors by ensuring proper relationships and RLS policies

-- =============================================
-- STEP 1: ENSURE PROPER TABLE STRUCTURE
-- =============================================

-- Ensure service_providers table has all required columns
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS job_category_id UUID REFERENCES job_categories(id);

-- Ensure services table has proper user_id linkage  
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================
-- STEP 2: CREATE UPDATED TRIGGER FUNCTION
-- =============================================

-- Function to ensure service_provider exists and is properly linked
CREATE OR REPLACE FUNCTION ensure_service_provider_linkage()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
  profile_data RECORD;
BEGIN
  -- Set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Check if user is authenticated
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create services';
  END IF;
  
  -- Get or create service_provider_id
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- If no service provider exists, create one with profile data
  IF sp_id IS NULL THEN
    -- Get user profile data first
    SELECT first_name, last_name, profile_photo_url 
    INTO profile_data 
    FROM profiles 
    WHERE id = auth.uid();
    
    INSERT INTO service_providers (
      user_id, 
      business_name, 
      business_description,
      profile_photo_url,
      subscription_plan, 
      is_approved,
      rating,
      total_reviews
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, 
        CASE 
          WHEN profile_data.first_name IS NOT NULL THEN 
            profile_data.first_name || ' ' || COALESCE(profile_data.last_name, '')
          ELSE 'My Business'
        END
      ), 
      'Professional service provider',
      profile_data.profile_photo_url,
      COALESCE(NEW.subscription_plan, 'basic'),
      true, -- Auto-approve for now
      0,
      0
    )
    RETURNING id INTO sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger
DROP TRIGGER IF EXISTS trigger_ensure_service_provider_linkage ON services;
CREATE TRIGGER trigger_ensure_service_provider_linkage
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION ensure_service_provider_linkage();

-- =============================================
-- STEP 3: UPDATE RLS POLICIES FOR JOINS
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "service_providers_read_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_own_management" ON service_providers;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;

-- Enable RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Service providers policies - Allow reading for service details
CREATE POLICY "service_providers_read_access" ON service_providers
  FOR SELECT
  USING (true); -- Allow all authenticated users to read service providers for joins

CREATE POLICY "service_providers_own_management" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Profiles policies - Allow reading for joins with service providers
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT
  USING (true); -- Allow reading profiles for service provider details

CREATE POLICY "profiles_own_management" ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================
-- STEP 4: SYNC EXISTING DATA
-- =============================================

-- Update existing services that might be missing user_id
UPDATE services 
SET user_id = sp.user_id
FROM service_providers sp
WHERE services.service_provider_id = sp.id 
AND services.user_id IS NULL;

-- Sync profile photos to service providers
UPDATE service_providers 
SET profile_photo_url = profiles.profile_photo_url
FROM profiles 
WHERE service_providers.user_id = profiles.id 
AND service_providers.profile_photo_url IS NULL
AND profiles.profile_photo_url IS NOT NULL;

-- =============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_service_provider_id ON services(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_job_category ON service_providers(job_category_id);

-- =============================================
-- STEP 6: GRANT PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON service_providers TO authenticated, anon;
GRANT SELECT ON profiles TO authenticated, anon;
GRANT SELECT ON job_categories TO authenticated, anon;
GRANT ALL ON service_providers TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';