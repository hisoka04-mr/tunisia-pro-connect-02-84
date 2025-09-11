-- First, let's drop ALL existing policies for service_providers and services tables
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    -- Drop all existing policies for service_providers
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'service_providers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON service_providers', pol_name);
    END LOOP;
    
    -- Drop all existing policies for services
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'services'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON services', pol_name);
    END LOOP;
END $$;

-- Now create the new policies for service_providers
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for services
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

-- Create function to automatically handle service provider creation
CREATE OR REPLACE FUNCTION set_service_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Try to get existing service_provider_id for the user
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- If no service provider record exists, create one
  IF sp_id IS NULL THEN
    INSERT INTO service_providers (user_id, is_approved)
    VALUES (auth.uid(), true)
    RETURNING id INTO sp_id;
  END IF;
  
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