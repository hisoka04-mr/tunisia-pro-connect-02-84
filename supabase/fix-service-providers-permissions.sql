-- Fix service_providers table permissions
-- This addresses the "permission denied for table service_providers" error

-- Enable RLS on service_providers table
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "service_providers_own_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_admin_access" ON service_providers;

-- Create comprehensive policies for service_providers table

-- 1. Users can access their own service provider record
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. All authenticated users can read approved service providers (for public viewing)
CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated
  USING (is_approved = true OR user_id = auth.uid());

-- 3. Admins have full access
CREATE POLICY "service_providers_admin_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON service_providers TO authenticated;

-- Also fix services table permissions if needed
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing services policies
DROP POLICY IF EXISTS "services_provider_access" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;

-- Create services policies
CREATE POLICY "services_provider_access" ON services
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true OR user_id = auth.uid() OR auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com'));

-- Grant permissions for services table
GRANT ALL ON services TO authenticated;