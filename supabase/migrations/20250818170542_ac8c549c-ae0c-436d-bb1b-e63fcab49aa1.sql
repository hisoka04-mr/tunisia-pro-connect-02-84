-- Drop conflicting policies and create clearer ones for service_providers table
DROP POLICY IF EXISTS "Public can view basic business info of approved providers" ON service_providers;
DROP POLICY IF EXISTS "Service providers can view their own full profile" ON service_providers;
DROP POLICY IF EXISTS "Users can view all service providers" ON service_providers;

-- Create new policies with clear separation
-- Policy 1: Users can view their own service provider profile (regardless of approval status)
CREATE POLICY "Users can view their own service provider profile" 
ON service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Public can view approved service providers only
CREATE POLICY "Public can view approved service providers" 
ON service_providers 
FOR SELECT 
USING (is_approved = true);

-- Keep existing insert and update policies
-- Users can insert their own service provider profile - already exists
-- Users can update their own service provider profile - already exists