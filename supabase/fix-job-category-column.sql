-- Fix job_category_id column in services table
-- This adds the missing job_category_id column that's causing the schema error

-- Add job_category_id column to services table if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS job_category_id UUID REFERENCES job_categories(id);

-- Create an index on job_category_id for better performance
CREATE INDEX IF NOT EXISTS idx_services_job_category_id ON services(job_category_id);

-- Update the trigger function to handle job_category_id properly
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
  
  -- Keep job_category_id as provided (don't override it)
  -- NEW.job_category_id remains unchanged
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_set_service_user_fields ON services;
CREATE TRIGGER trigger_set_service_user_fields
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_user_fields();

-- Also ensure job_categories table has proper permissions
GRANT SELECT ON job_categories TO authenticated;
GRANT SELECT ON job_categories TO anon;