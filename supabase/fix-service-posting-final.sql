-- Final fix for service posting errors
-- This addresses: duplicate relationships, missing job_category_id column, and RLS policies

-- =============================================
-- DISABLE RLS TEMPORARILY FOR CLEANUP
-- =============================================
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories DISABLE ROW LEVEL SECURITY;

-- =============================================
-- FIX DUPLICATE FOREIGN KEY RELATIONSHIPS
-- =============================================

-- Drop ALL existing foreign key constraints for services table
ALTER TABLE services DROP CONSTRAINT IF EXISTS fk_services_service_provider;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_service_provider_id_fkey;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_user_id_fkey;

-- Drop and recreate the services table to ensure clean schema
DROP TABLE IF EXISTS services CASCADE;

-- Recreate services table with proper structure
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    subscription_plan TEXT NOT NULL DEFAULT 'basic',
    job_category_id UUID NOT NULL,
    user_id UUID NOT NULL,
    service_provider_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add proper foreign key constraints (one relationship each)
ALTER TABLE services 
    ADD CONSTRAINT services_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE services 
    ADD CONSTRAINT services_service_provider_id_fkey 
    FOREIGN KEY (service_provider_id) REFERENCES service_providers(id) ON DELETE CASCADE;

ALTER TABLE services 
    ADD CONSTRAINT services_job_category_id_fkey 
    FOREIGN KEY (job_category_id) REFERENCES job_categories(id) ON DELETE CASCADE;

-- =============================================
-- CREATE HELPER FUNCTIONS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.email() IN (
    'admin@sevigo.com',
    'admin@admin.com', 
    'support@sevigo.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ENABLE RLS WITH PROPER POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_all_access" ON profiles;
DROP POLICY IF EXISTS "job_categories_read_all" ON job_categories;
DROP POLICY IF EXISTS "job_categories_admin_manage" ON job_categories;
DROP POLICY IF EXISTS "service_providers_own_management" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_admin_manage" ON service_providers;
DROP POLICY IF EXISTS "services_owner_management" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;

-- Profiles policies
CREATE POLICY "profiles_all_access" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Job categories policies
CREATE POLICY "job_categories_read_all" ON job_categories
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "job_categories_admin_manage" ON job_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service providers policies
CREATE POLICY "service_providers_own_management" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Services policies
CREATE POLICY "services_owner_management" ON services
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true OR user_id = auth.uid() OR is_admin());

-- =============================================
-- CREATE TRIGGER FOR AUTOMATIC USER FIELDS
-- =============================================

-- Function to set user fields automatically
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
      is_approved
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, 'My Business'), 
      COALESCE(NEW.subscription_plan, 'basic'),
      false
    )
    RETURNING id INTO sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_service_user_fields ON services;
CREATE TRIGGER trigger_set_service_user_fields
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_user_fields();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant table permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

GRANT ALL ON service_providers TO authenticated;
GRANT SELECT ON service_providers TO anon;

GRANT ALL ON services TO authenticated;
GRANT SELECT ON services TO anon;

GRANT SELECT ON job_categories TO authenticated, anon;
GRANT ALL ON job_categories TO authenticated;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';