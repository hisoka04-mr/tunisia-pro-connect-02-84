-- Fix RLS policies for service_providers table to ensure users can always access their own profile

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own service provider profile" ON service_providers;
DROP POLICY IF EXISTS "Public can view approved service providers" ON service_providers;

-- Recreate policies with explicit permissions
CREATE POLICY "Users can view their own service provider profile" 
ON service_providers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view approved service providers" 
ON service_providers 
FOR SELECT 
USING (is_approved = true);

-- Ensure users can insert their own service provider profile
CREATE POLICY "Users can insert their own service provider profile" 
ON service_providers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure users can update their own service provider profile  
CREATE POLICY "Users can update their own service provider profile"
ON service_providers 
FOR UPDATE 
USING (auth.uid() = user_id);