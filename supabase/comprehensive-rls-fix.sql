-- Comprehensive RLS and Database Fix
-- This addresses all service posting permission issues and relationship problems

-- =============================================
-- CLEAN UP DUPLICATE RELATIONSHIPS
-- =============================================

-- Drop duplicate foreign key constraints that are causing relationship conflicts
ALTER TABLE services DROP CONSTRAINT IF EXISTS fk_services_service_provider;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_service_provider_id_fkey;

-- Add back a single, clean foreign key relationship
ALTER TABLE services ADD CONSTRAINT services_service_provider_id_fkey 
  FOREIGN KEY (service_provider_id) REFERENCES service_providers(id) ON DELETE CASCADE;

-- =============================================
-- DISABLE RLS TEMPORARILY TO CLEAN UP
-- =============================================

ALTER TABLE service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories DISABLE ROW LEVEL SECURITY;

-- =============================================
-- DROP ALL EXISTING POLICIES
-- =============================================

-- Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "service_providers_own_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_admin_access" ON service_providers;
DROP POLICY IF EXISTS "services_provider_insert" ON services;
DROP POLICY IF EXISTS "services_provider_update" ON services;
DROP POLICY IF EXISTS "services_provider_delete" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;
DROP POLICY IF EXISTS "services_admin_access" ON services;
DROP POLICY IF EXISTS "services_provider_access" ON services;
DROP POLICY IF EXISTS "services_owner_access" ON services;
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "job_categories_read_policy" ON job_categories;
DROP POLICY IF EXISTS "job_categories_admin_policy" ON job_categories;

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

-- Function to check if user is a service provider
CREATE OR REPLACE FUNCTION is_service_provider()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM service_providers 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RE-ENABLE RLS WITH PROPER POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

CREATE POLICY "profiles_all_access" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- =============================================
-- JOB CATEGORIES TABLE POLICIES
-- =============================================

CREATE POLICY "job_categories_read_all" ON job_categories
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "job_categories_admin_manage" ON job_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- SERVICE PROVIDERS TABLE POLICIES
-- =============================================

-- Users can manage their own service provider record
CREATE POLICY "service_providers_own_management" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Everyone can read approved service providers
CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated, anon
  USING (is_approved = true OR user_id = auth.uid() OR is_admin());

-- Admins can manage all service providers
CREATE POLICY "service_providers_admin_manage" ON service_providers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- SERVICES TABLE POLICIES
-- =============================================

-- Service providers can manage their own services
CREATE POLICY "services_owner_management" ON services
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() OR is_admin()
  );

-- Public can read active services
CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated, anon
  USING (
    is_active = true OR 
    user_id = auth.uid() OR 
    is_admin()
  );

-- =============================================
-- TRIGGER FUNCTIONS
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

-- Create trigger for services
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
-- SEED JOB CATEGORIES
-- =============================================

INSERT INTO job_categories (name, description) VALUES
  ('Plumbing', 'Water systems, pipes, and fixtures installation and repair'),
  ('Electrical', 'Electrical installations, repairs, and maintenance'),
  ('Carpentry', 'Wood work, furniture, and construction'),
  ('Painting', 'Interior and exterior painting services'),
  ('Cleaning', 'House and office cleaning services'),
  ('Gardening', 'Landscaping and garden maintenance'),
  ('Tutoring', 'Educational and academic support'),
  ('Photography', 'Event and portrait photography'),
  ('Catering', 'Food services for events and occasions'),
  ('Transportation', 'Moving and delivery services')
ON CONFLICT (name) DO NOTHING;