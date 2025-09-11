-- Fix RLS policies for service_providers table to allow authenticated users to access and create records

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Public can view approved service providers" ON service_providers;
DROP POLICY IF EXISTS "Users can insert their own service provider profile" ON service_providers;
DROP POLICY IF EXISTS "Users can update their own service provider profile" ON service_providers;
DROP POLICY IF EXISTS "Users can view their own service provider profile" ON service_providers;

-- Create more permissive policies for service_providers
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix services table policies to work with the new service_providers structure
DROP POLICY IF EXISTS "Everyone can view active services" ON services;
DROP POLICY IF EXISTS "Service providers can delete their own services" ON services;
DROP POLICY IF EXISTS "Service providers can insert their own services" ON services;
DROP POLICY IF EXISTS "Service providers can update their own services" ON services;
DROP POLICY IF EXISTS "Service providers can view their own services" ON services;

-- Create comprehensive services policies
CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "services_owner_access" ON services
  FOR ALL
  TO authenticated
  USING (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- Create or update function to automatically set service provider fields
CREATE OR REPLACE FUNCTION set_service_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Set user_id if not already set
  IF NEW.service_provider_id IS NULL THEN
    -- Try to get existing service_provider_id for the user
    SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
    
    -- If no service provider record exists, create one
    IF sp_id IS NULL THEN
      INSERT INTO service_providers (user_id, is_approved)
      VALUES (auth.uid(), true)
      RETURNING id INTO sp_id;
    END IF;
    
    NEW.service_provider_id = sp_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set service provider fields
DROP TRIGGER IF EXISTS trigger_set_service_user_fields ON services;
CREATE TRIGGER trigger_set_service_user_fields
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_user_fields();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON service_providers TO authenticated;
GRANT ALL ON services TO authenticated;