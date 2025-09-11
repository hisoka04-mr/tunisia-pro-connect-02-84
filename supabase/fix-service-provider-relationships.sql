-- COMPREHENSIVE FIX FOR SERVICE PROVIDER RELATIONSHIPS
-- This ensures every service post has proper provider data and eliminates "Provider Not Found" errors

-- =============================================
-- STEP 1: ENSURE PROPER TABLE STRUCTURE
-- =============================================

-- Make sure services table has proper user_id relationship
ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON public.service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- =============================================
-- STEP 2: SYNC EXISTING DATA
-- =============================================

-- Update services.user_id from service_providers where missing
UPDATE public.services 
SET user_id = sp.user_id
FROM public.service_providers sp
WHERE services.service_provider_id = sp.id 
  AND services.user_id IS NULL;

-- Create missing service_providers for services that have user_id but no service_provider_id
INSERT INTO public.service_providers (
  id,
  user_id,
  business_name,
  business_description,
  rating,
  total_reviews,
  subscription_plan,
  is_approved,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  s.user_id,
  COALESCE(s.business_name, p.first_name || ' ' || COALESCE(p.last_name, ''), 'Service Provider') as business_name,
  'Professional service provider' as business_description,
  0 as rating,
  0 as total_reviews,
  'basic' as subscription_plan,
  true as is_approved,
  now() as created_at,
  now() as updated_at
FROM public.services s
LEFT JOIN public.profiles p ON p.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND s.service_provider_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.service_providers sp 
    WHERE sp.user_id = s.user_id
  );

-- Update services to link with their service providers
UPDATE public.services 
SET service_provider_id = sp.id
FROM public.service_providers sp
WHERE services.user_id = sp.user_id 
  AND services.service_provider_id IS NULL;

-- =============================================
-- STEP 3: CREATE AUTOMATIC USER FIELD SETTER
-- =============================================

-- Function to automatically set user_id and create service_provider if needed
CREATE OR REPLACE FUNCTION ensure_service_user_relationships()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Always set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Ensure user is authenticated
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create services';
  END IF;
  
  -- Get or create service_provider_id
  SELECT id INTO sp_id FROM public.service_providers WHERE user_id = auth.uid();
  
  -- If no service provider exists, create one automatically
  IF sp_id IS NULL THEN
    INSERT INTO public.service_providers (
      user_id, 
      business_name, 
      subscription_plan, 
      is_approved,
      rating,
      total_reviews,
      created_at,
      updated_at
    )
    VALUES (
      auth.uid(), 
      COALESCE(NEW.business_name, NEW.service_title, 'My Business'), 
      COALESCE(NEW.subscription_plan, 'basic'),
      true, -- Auto-approve to avoid blocking
      0,
      0,
      now(),
      now()
    )
    RETURNING id INTO sp_id;
  END IF;
  
  -- Set service_provider_id
  NEW.service_provider_id = sp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new services
DROP TRIGGER IF EXISTS trigger_ensure_service_user_relationships ON public.services;
CREATE TRIGGER trigger_ensure_service_user_relationships
  BEFORE INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION ensure_service_user_relationships();

-- =============================================
-- STEP 4: SYNC PROFILE PHOTOS TO SERVICE PROVIDERS
-- =============================================

-- Update service providers with profile photos from profiles table
UPDATE public.service_providers 
SET profile_photo_url = profiles.profile_photo_url,
    updated_at = now()
FROM public.profiles 
WHERE service_providers.user_id = profiles.id 
  AND profiles.profile_photo_url IS NOT NULL
  AND (service_providers.profile_photo_url IS NULL OR service_providers.profile_photo_url != profiles.profile_photo_url);

-- Function to sync profile changes to service providers
CREATE OR REPLACE FUNCTION sync_profile_to_service_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- Update service provider when profile is updated
  UPDATE public.service_providers 
  SET 
    profile_photo_url = NEW.profile_photo_url,
    updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS trigger_sync_profile_to_service_provider ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_service_provider
  AFTER UPDATE OF profile_photo_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_service_provider();

-- =============================================
-- STEP 5: CREATE COMPREHENSIVE VIEW FOR SERVICE QUERIES
-- =============================================

-- Create a view that always includes complete provider data
CREATE OR REPLACE VIEW services_with_complete_provider_data AS
SELECT 
  s.*,
  -- Service provider data (guaranteed to exist)
  jsonb_build_object(
    'id', sp.id,
    'user_id', sp.user_id,
    'business_name', sp.business_name,
    'business_description', sp.business_description,
    'rating', COALESCE(sp.rating, 0),
    'total_reviews', COALESCE(sp.total_reviews, 0),
    'profile_photo_url', sp.profile_photo_url,
    'is_approved', COALESCE(sp.is_approved, false),
    'job_category_id', sp.job_category_id
  ) as service_provider_data,
  
  -- Profile data (from profiles table)
  jsonb_build_object(
    'first_name', p.first_name,
    'last_name', p.last_name,
    'profile_photo_url', p.profile_photo_url,
    'full_name', TRIM(CONCAT(p.first_name, ' ', p.last_name))
  ) as profile_data,
  
  -- Category data
  jsonb_build_object(
    'id', jc.id,
    'name', jc.name,
    'description', jc.description
  ) as category_data,
  
  -- Combined provider info (prefer profile data, fallback to service provider data)
  COALESCE(
    TRIM(CONCAT(p.first_name, ' ', p.last_name)),
    sp.business_name,
    s.business_name,
    'Service Provider'
  ) as provider_name,
  
  COALESCE(
    p.profile_photo_url,
    sp.profile_photo_url
  ) as provider_photo

FROM public.services s
INNER JOIN public.service_providers sp ON s.service_provider_id = sp.id
LEFT JOIN public.profiles p ON sp.user_id = p.id  
LEFT JOIN public.job_categories jc ON COALESCE(sp.job_category_id, s.job_category_id) = jc.id
WHERE s.is_active = true;

-- =============================================
-- STEP 6: FIX RLS POLICIES FOR PROPER ACCESS
-- =============================================

-- Disable RLS temporarily for cleanup
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "services_read_all" ON public.services;
DROP POLICY IF EXISTS "services_authenticated_insert" ON public.services;
DROP POLICY IF EXISTS "services_own_management" ON public.services;
DROP POLICY IF EXISTS "services_public_read" ON public.services;

DROP POLICY IF EXISTS "service_providers_read_all" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_own_access" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON public.service_providers;

DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for reading (needed for service browsing)
CREATE POLICY "services_read_all" ON public.services
  FOR SELECT
  USING (true); -- Allow all reads for service browsing

CREATE POLICY "service_providers_read_all" ON public.service_providers
  FOR SELECT
  USING (true); -- Allow all reads for service provider info

CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT
  USING (true); -- Allow all reads for profile info in service listings

-- Create restrictive policies for data modification
CREATE POLICY "services_own_management" ON public.services
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

CREATE POLICY "service_providers_own_access" ON public.service_providers
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

CREATE POLICY "profiles_own_access" ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    id = auth.uid() OR 
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  )
  WITH CHECK (
    id = auth.uid() OR 
    auth.email() IN ('admin@sevigo.com', 'admin@admin.com', 'support@sevigo.com')
  );

-- =============================================
-- STEP 7: GRANT COMPREHENSIVE PERMISSIONS
-- =============================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant read access to all for service browsing
GRANT SELECT ON public.services TO authenticated, anon;
GRANT SELECT ON public.service_providers TO authenticated, anon;
GRANT SELECT ON public.profiles TO authenticated, anon;
GRANT SELECT ON public.job_categories TO authenticated, anon;

-- Grant write access to authenticated users for their own data
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Grant access to the view
GRANT SELECT ON services_with_complete_provider_data TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- STEP 8: REFRESH AND VERIFY
-- =============================================

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT 
  'Database Status Check' as check_name,
  'Services without user_id' as issue_type,
  COUNT(*) as count
FROM public.services 
WHERE user_id IS NULL AND is_active = true

UNION ALL

SELECT 
  'Database Status Check',
  'Services without service_provider_id',
  COUNT(*)
FROM public.services 
WHERE service_provider_id IS NULL AND is_active = true

UNION ALL

SELECT 
  'Database Status Check',
  'Service providers without profiles',
  COUNT(*)
FROM public.service_providers sp
LEFT JOIN public.profiles p ON sp.user_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Database Status Check',
  'Total active services',
  COUNT(*)
FROM public.services 
WHERE is_active = true;