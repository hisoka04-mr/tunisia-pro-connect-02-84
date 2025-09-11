-- Fix service_providers table structure for business_name column
-- This ensures the business_name column exists and is properly set up

-- Add business_name column if it doesn't exist
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add business_description column if it doesn't exist (for additional info)
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_service_providers_business_name ON service_providers(business_name) WHERE business_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);

-- Update any existing service providers that might not have business_name set
UPDATE service_providers 
SET business_name = COALESCE(business_name, 'My Business')
WHERE business_name IS NULL OR business_name = '';

-- Function to ensure service provider is created when user posts service
CREATE OR REPLACE FUNCTION ensure_service_provider_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Always set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Try to get existing service_provider_id
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- If service provider doesn't exist, create one
  IF sp_id IS NULL THEN
    INSERT INTO service_providers (
      user_id, 
      business_name, 
      subscription_plan, 
      is_approved,
      business_description
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, 'My Business'), 
      'basic', 
      false,
      COALESCE(NEW.description, '')
    )
    RETURNING id INTO sp_id;
  ELSE
    -- Update existing service provider business name if provided
    UPDATE service_providers 
    SET business_name = COALESCE(NEW.business_name, business_name),
        business_description = COALESCE(NEW.description, business_description),
        updated_at = now()
    WHERE id = sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_ensure_service_provider_exists ON public.services;

-- Create trigger to ensure service provider exists when service is created
CREATE TRIGGER trigger_ensure_service_provider_exists
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION ensure_service_provider_exists();

-- Grant necessary permissions
GRANT ALL ON service_providers TO authenticated;
GRANT SELECT ON service_providers TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';