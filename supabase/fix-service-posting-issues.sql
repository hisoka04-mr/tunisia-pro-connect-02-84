-- COMPREHENSIVE SERVICE POSTING FIX
-- Run this to resolve all service posting issues

-- =============================================
-- STEP 1: DISABLE RLS TEMPORARILY FOR CLEANUP
-- =============================================
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- =============================================
DROP POLICY IF EXISTS "authenticated_users_can_insert_services" ON services;
DROP POLICY IF EXISTS "users_can_manage_own_services" ON services;  
DROP POLICY IF EXISTS "users_can_delete_own_services" ON services;
DROP POLICY IF EXISTS "anyone_can_view_services" ON services;
DROP POLICY IF EXISTS "services_owner_management" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;

DROP POLICY IF EXISTS "service_providers_full_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_own_management" ON service_providers;

-- =============================================
-- STEP 3: ENSURE TABLES HAVE PROPER STRUCTURE
-- =============================================

-- Ensure services table has all required columns
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS service_title TEXT,
  ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS fixed_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS availability JSONB,
  ADD COLUMN IF NOT EXISTS area_covered TEXT[],
  ADD COLUMN IF NOT EXISTS delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS skills_tools TEXT[],
  ADD COLUMN IF NOT EXISTS portfolio_files TEXT[];

-- =============================================
-- STEP 4: CREATE ADMIN FUNCTION
-- =============================================
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
-- STEP 5: CREATE SERVICE PROVIDER AUTO-CREATION TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION ensure_service_provider_on_service_insert()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Check if user is authenticated
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
      rating,
      total_reviews
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, NEW.service_title, 'My Business'), 
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_ensure_service_provider_on_service_insert ON services;
CREATE TRIGGER trigger_ensure_service_provider_on_service_insert
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION ensure_service_provider_on_service_insert();

-- =============================================
-- STEP 6: CREATE PERMISSIVE RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_all_access" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Job categories policies (allow everyone to read)
CREATE POLICY "job_categories_read_all" ON job_categories
  FOR SELECT
  USING (true);

CREATE POLICY "job_categories_admin_manage" ON job_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service providers policies
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  USING (true);

-- Services policies - VERY PERMISSIVE FOR AUTHENTICATED USERS
CREATE POLICY "services_authenticated_insert" ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow any authenticated user to insert

CREATE POLICY "services_own_management" ON services
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "services_own_delete" ON services
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "services_public_read" ON services
  FOR SELECT
  USING (true); -- Allow everyone to view services

-- =============================================
-- STEP 7: GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

GRANT ALL ON service_providers TO authenticated;
GRANT SELECT ON service_providers TO anon;

GRANT ALL ON services TO authenticated;
GRANT SELECT ON services TO anon;

GRANT ALL ON job_categories TO authenticated;
GRANT SELECT ON job_categories TO anon;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- STEP 8: SEED DEFAULT CATEGORIES IF EMPTY
-- =============================================
INSERT INTO job_categories (id, name, description) VALUES
  ('291ae302-4d20-418a-80e0-8033ed2405f0', 'Carpentry', 'Wood work, furniture, and construction'),
  ('b7b3b819-944a-4a17-b068-dc9e7a8a3247', 'Electrical', 'Electrical installations, repairs, and maintenance'),
  ('ab0bca0a-fd48-4b8d-93f7-3adbb2f0f643', 'Photography', 'Event and portrait photography'),
  ('c1234567-1234-1234-1234-123456789012', 'Plumbing', 'Plumbing repairs and installations'),
  ('d1234567-1234-1234-1234-123456789012', 'Cleaning', 'House and office cleaning services')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 9: REFRESH SCHEMA AND VERIFY
-- =============================================
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT 
  'Services Table' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services' AND rowsecurity = true) 
    THEN '✅ RLS Enabled' 
    ELSE '❌ RLS Disabled' 
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services') as policy_count

UNION ALL

SELECT 
  'Service Providers Table',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_providers' AND rowsecurity = true) 
    THEN '✅ RLS Enabled' 
    ELSE '❌ RLS Disabled' 
  END,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_providers')

UNION ALL

SELECT 
  'Job Categories',
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_categories' AND rowsecurity = true) 
    THEN '✅ RLS Enabled' 
    ELSE '❌ RLS Disabled' 
  END,
  (SELECT COUNT(*) FROM job_categories);