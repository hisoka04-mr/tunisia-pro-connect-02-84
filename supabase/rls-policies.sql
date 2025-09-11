-- Add user_id column to services table if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on the services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service providers can insert their own services" ON services;
DROP POLICY IF EXISTS "Service providers can update their own services" ON services;
DROP POLICY IF EXISTS "Service providers can delete their own services" ON services;
DROP POLICY IF EXISTS "Clients can view all services" ON services;
DROP POLICY IF EXISTS "Admins can do everything" ON services;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT := 'client'; -- default role
BEGIN
  -- Check if user is admin
  IF auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com') THEN
    RETURN 'admin';
  END IF;
  
  -- Check if user is a service provider
  IF EXISTS (SELECT 1 FROM service_providers WHERE user_id = auth.uid()) THEN
    RETURN 'service_provider';
  END IF;
  
  -- Default to client
  RETURN 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Service providers can insert their own services
CREATE POLICY "Service providers can insert their own services"
ON services
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'service_provider');

-- Policy 2: Service providers can update their own services
CREATE POLICY "Service providers can update their own services"
ON services
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND get_user_role() = 'service_provider')
WITH CHECK (auth.uid() = user_id AND get_user_role() = 'service_provider');

-- Policy 3: Service providers can delete their own services
CREATE POLICY "Service providers can delete their own services"
ON services
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND get_user_role() = 'service_provider');

-- Policy 4: Clients can view all services
CREATE POLICY "Clients can view all services"
ON services
FOR SELECT
TO authenticated
USING (get_user_role() IN ('client', 'service_provider', 'admin'));

-- Policy 5: Admins can do everything
CREATE POLICY "Admins can do everything"
ON services
FOR ALL
TO authenticated
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

-- Create a trigger to automatically set user_id when inserting
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set the user_id to the authenticated user
  NEW.user_id = auth.uid();
  
  -- Ensure user_id is not null
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create services';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs before insert
DROP TRIGGER IF EXISTS trigger_set_user_id ON services;
CREATE TRIGGER trigger_set_user_id
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON services TO authenticated;