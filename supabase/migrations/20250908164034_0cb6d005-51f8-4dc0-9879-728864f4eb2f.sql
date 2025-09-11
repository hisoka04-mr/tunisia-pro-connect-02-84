-- Comprehensive fix for account types and service visibility
-- This addresses: account types, missing posts, and RLS policies

-- =============================================
-- 1. ENSURE PROPER ACCOUNT TYPES IN PROFILES
-- =============================================

-- Update profiles table to ensure account_type column exists with proper constraint
ALTER TABLE profiles 
ALTER COLUMN account_type SET DEFAULT 'client';

-- Add constraint to ensure only valid account types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_account_type_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_account_type_check 
        CHECK (account_type IN ('client', 'onsite_provider', 'online_provider'));
    END IF;
END $$;

-- =============================================
-- 2. FIX SERVICE_PROVIDERS TABLE SCHEMA
-- =============================================

-- Ensure service_providers has all necessary columns
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'My Business',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Ensure rating column has correct type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_providers' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE service_providers ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
    END IF;
END $$;

-- Update any existing service_providers to have default values
UPDATE service_providers 
SET 
    business_name = COALESCE(business_name, 'My Business'),
    subscription_plan = COALESCE(subscription_plan, 'basic'),
    experience_years = COALESCE(experience_years, 0),
    total_reviews = COALESCE(total_reviews, 0),
    rating = COALESCE(rating, 0.00)
WHERE business_name IS NULL OR subscription_plan IS NULL;

-- =============================================
-- 3. CREATE FUNCTION TO UPDATE ACCOUNT TYPES
-- =============================================

-- Function to automatically update account type when service provider posts a service
CREATE OR REPLACE FUNCTION update_account_type_on_service_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's account type based on service type
  UPDATE profiles 
  SET account_type = CASE 
    WHEN NEW.service_type = 'onsite' THEN 'onsite_provider'
    WHEN NEW.service_type = 'online' THEN 'online_provider'
    ELSE 'onsite_provider' -- default fallback
  END,
  updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on services table
DROP TRIGGER IF EXISTS trigger_update_account_type_on_service_creation ON services;
CREATE TRIGGER trigger_update_account_type_on_service_creation
  AFTER INSERT OR UPDATE OF service_type ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_account_type_on_service_creation();

-- =============================================
-- 4. UPDATE EXISTING USERS' ACCOUNT TYPES
-- =============================================

-- Update existing users who have posted services to have correct account type
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
    AND (s.service_type = 'onsite' OR s.service_type IS NULL)
  ) THEN 'onsite_provider'
  WHEN EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.user_id = profiles.id
  ) THEN 'onsite_provider'
  ELSE account_type
END,
updated_at = now()
WHERE account_type = 'client' 
AND (
  EXISTS (SELECT 1 FROM services WHERE user_id = profiles.id) 
  OR EXISTS (SELECT 1 FROM service_providers WHERE user_id = profiles.id)
);

-- =============================================
-- 5. FIX RLS POLICIES FOR PROPER ACCESS
-- =============================================

-- Drop existing restrictive policies that might be hiding data
DROP POLICY IF EXISTS "services_owner_management" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;
DROP POLICY IF EXISTS "service_providers_own_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;

-- Create comprehensive RLS policies for services
CREATE POLICY "services_provider_management" ON services
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Allow everyone to view active services (for browsing and booking)
CREATE POLICY "services_public_view" ON services
  FOR SELECT
  TO authenticated, anon
  USING (
    is_active = true OR 
    user_id = auth.uid() OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Create comprehensive RLS policies for service_providers
CREATE POLICY "service_providers_own_management" ON service_providers
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Allow everyone to view service providers (for browsing)
CREATE POLICY "service_providers_public_view" ON service_providers
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- =============================================
-- 6. ENSURE SERVICE POSTING WORKS
-- =============================================

-- Update the service creation trigger to handle user_id and service_provider_id
CREATE OR REPLACE FUNCTION set_service_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Ensure user is authenticated
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create services';
  END IF;
  
  -- Get or create service_provider_id
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- If no service provider exists, create one automatically
  IF sp_id IS NULL THEN
    INSERT INTO service_providers (
      user_id, 
      business_name, 
      subscription_plan, 
      is_approved,
      location
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, 'My Business'), 
      COALESCE(NEW.subscription_plan, 'basic'),
      true, -- Auto-approve to allow service posting
      COALESCE(NEW.location, 'Tunisia')
    )
    RETURNING id INTO sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_set_service_user_fields ON services;
CREATE TRIGGER trigger_set_service_user_fields
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_user_fields();

-- =============================================
-- 7. GRANT PROPER PERMISSIONS
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON service_providers TO authenticated;
GRANT SELECT ON service_providers TO anon;
GRANT ALL ON services TO authenticated;
GRANT SELECT ON services TO anon;
GRANT SELECT ON job_categories TO authenticated, anon;

-- =============================================
-- 8. REFRESH SCHEMA CACHE
-- =============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';