-- Fix function security by setting proper search_path
-- This addresses the "Function Search Path Mutable" security warning

-- Fix the update_account_type_on_service_creation function
CREATE OR REPLACE FUNCTION update_account_type_on_service_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's account type based on service type
  UPDATE profiles 
  SET account_type = CASE 
    WHEN NEW.service_type = 'onsite' THEN 'onsite_provider'
    WHEN NEW.service_type = 'online' THEN 'online_provider'
    ELSE 'onsite_provider' -- default fallback
  END,
  updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Fix the set_service_user_fields function  
CREATE OR REPLACE FUNCTION set_service_user_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Ensure user is authenticated
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create services';
  END IF;
  
  -- Get or create service_provider_id
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- If no service provider exists, create one automatically
  IF sp_id IS NULL THEN
    INSERT INTO service_providers (
      user_id, 
      business_name, 
      subscription_plan, 
      is_approved,
      location
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, 'My Business'), 
      COALESCE(NEW.subscription_plan, 'basic'),
      true, -- Auto-approve to allow service posting
      COALESCE(NEW.location, 'Tunisia')
    )
    RETURNING id INTO sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$;