-- Apply RLS fixes for service posting
-- Run this SQL in your Supabase SQL Editor to fix permission issues

-- Enable RLS and create comprehensive policies for service_providers table
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "service_providers_own_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_admin_access" ON service_providers;

-- Policy 1: Users can fully manage their own service provider record
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 2: All authenticated users can read service providers (for browsing)
CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Admins have full access
CREATE POLICY "service_providers_admin_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Fix services table RLS as well
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing services policies
DROP POLICY IF EXISTS "services_provider_insert" ON services;
DROP POLICY IF EXISTS "services_provider_update" ON services;
DROP POLICY IF EXISTS "services_provider_delete" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;
DROP POLICY IF EXISTS "services_admin_access" ON services;
DROP POLICY IF EXISTS "services_provider_access" ON services;

-- Create comprehensive services policies
CREATE POLICY "services_owner_access" ON services
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

CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated
  USING (
    is_active = true OR 
    user_id = auth.uid() OR
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- Fix the function to automatically set user_id
CREATE OR REPLACE FUNCTION set_service_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Always set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Try to get or create service_provider_id
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- If service provider doesn't exist, create one
  IF sp_id IS NULL THEN
    INSERT INTO service_providers (user_id, business_name, subscription_plan, is_approved)
    VALUES (auth.uid(), COALESCE(NEW.business_name, 'My Business'), 'basic', false)
    RETURNING id INTO sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_set_service_user_fields ON services;
CREATE TRIGGER trigger_set_service_user_fields
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_user_fields();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON service_providers TO authenticated;
GRANT ALL ON services TO authenticated;
GRANT ALL ON job_categories TO authenticated;
GRANT ALL ON profiles TO authenticated;