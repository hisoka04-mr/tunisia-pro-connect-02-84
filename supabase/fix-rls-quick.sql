-- Quick fix for RLS policies to get the app working immediately
-- This addresses the immediate permission issues without full database restructuring

-- Enable RLS on essential tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "service_providers_own_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_admin_access" ON service_providers;
DROP POLICY IF EXISTS "services_provider_insert" ON services;
DROP POLICY IF EXISTS "services_provider_update" ON services;
DROP POLICY IF EXISTS "services_provider_delete" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;
DROP POLICY IF EXISTS "services_admin_access" ON services;

-- Create permissive policies for service_providers table
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to read service providers

CREATE POLICY "service_providers_admin_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Create permissive policies for services table
CREATE POLICY "services_provider_access" ON services
  FOR ALL
  TO authenticated
  USING (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true OR auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com'));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON service_providers TO authenticated;
GRANT ALL ON services TO authenticated;
GRANT SELECT ON job_categories TO authenticated;
GRANT ALL ON profiles TO authenticated;