-- FINAL FIX FOR SERVICE PROVIDER RELATIONS
-- This ensures services always have proper provider data and fixes the "provider not found" issue

-- =============================================
-- STEP 1: ENSURE ALL SERVICES HAVE SERVICE_PROVIDER_ID
-- =============================================

-- Create missing service providers for services that don't have them
INSERT INTO service_providers (
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
FROM services s
LEFT JOIN profiles p ON p.id = s.user_id
WHERE s.service_provider_id IS NULL
  AND s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.user_id = s.user_id
  );

-- Update services to link with their service providers
UPDATE services 
SET service_provider_id = sp.id
FROM service_providers sp
WHERE services.user_id = sp.user_id 
  AND services.service_provider_id IS NULL;

-- =============================================
-- STEP 2: SYNC PROFILE PHOTOS TO SERVICE PROVIDERS
-- =============================================

-- Update service providers with profile photos from profiles table
UPDATE service_providers 
SET profile_photo_url = profiles.profile_photo_url,
    updated_at = now()
FROM profiles 
WHERE service_providers.user_id = profiles.id 
  AND profiles.profile_photo_url IS NOT NULL
  AND (service_providers.profile_photo_url IS NULL OR service_providers.profile_photo_url != profiles.profile_photo_url);

-- =============================================
-- STEP 3: CREATE TRIGGER TO KEEP DATA IN SYNC
-- =============================================

-- Function to sync profile changes to service providers
CREATE OR REPLACE FUNCTION sync_profile_to_service_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- Update service provider when profile is updated
  UPDATE service_providers 
  SET 
    profile_photo_url = NEW.profile_photo_url,
    updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS trigger_sync_profile_to_service_provider ON profiles;
CREATE TRIGGER trigger_sync_profile_to_service_provider
  AFTER UPDATE OF profile_photo_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_service_provider();

-- =============================================
-- STEP 4: UPDATE RLS POLICIES TO ALLOW JOINS
-- =============================================

-- Drop and recreate policies with proper join support
DROP POLICY IF EXISTS "service_providers_read_for_services" ON service_providers;
DROP POLICY IF EXISTS "profiles_read_for_providers" ON profiles;

-- Allow reading service providers when fetching services (for joins)
CREATE POLICY "service_providers_read_for_services" ON service_providers
  FOR SELECT
  USING (true); -- Allow all reads for service listings

-- Allow reading profiles when fetching provider info (for joins)  
CREATE POLICY "profiles_read_for_providers" ON profiles
  FOR SELECT
  USING (true); -- Allow all reads for provider details

-- Ensure own data management still works
CREATE POLICY "service_providers_own_data" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_own_data" ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- =============================================

GRANT SELECT ON service_providers TO authenticated, anon;
GRANT SELECT ON profiles TO authenticated, anon;
GRANT SELECT ON services TO authenticated, anon;
GRANT SELECT ON job_categories TO authenticated, anon;

-- =============================================
-- STEP 6: CREATE VIEW FOR ENHANCED SERVICE QUERIES
-- =============================================

-- Create a view that always includes provider data
CREATE OR REPLACE VIEW services_with_providers AS
SELECT 
  s.*,
  COALESCE(
    jsonb_build_object(
      'id', sp.id,
      'user_id', sp.user_id,
      'business_name', sp.business_name,
      'business_description', sp.business_description,
      'rating', sp.rating,
      'total_reviews', sp.total_reviews,
      'profile_photo_url', sp.profile_photo_url,
      'is_approved', sp.is_approved,
      'job_category_id', sp.job_category_id
    ),
    jsonb_build_object(
      'id', s.service_provider_id,
      'user_id', s.user_id,
      'business_name', s.business_name,
      'business_description', null,
      'rating', 0,
      'total_reviews', 0,
      'profile_photo_url', null,
      'is_approved', false,
      'job_category_id', s.job_category_id
    )
  ) as service_provider_data,
  COALESCE(
    jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'profile_photo_url', p.profile_photo_url
    ),
    jsonb_build_object(
      'first_name', null,
      'last_name', null,
      'profile_photo_url', null
    )
  ) as profile_data,
  jc.name as category_name,
  jc.description as category_description
FROM services s
LEFT JOIN service_providers sp ON s.service_provider_id = sp.id
LEFT JOIN profiles p ON COALESCE(sp.user_id, s.user_id) = p.id
LEFT JOIN job_categories jc ON COALESCE(sp.job_category_id, s.job_category_id) = jc.id
WHERE s.is_active = true;

-- Grant access to the view
GRANT SELECT ON services_with_providers TO authenticated, anon;

-- =============================================
-- STEP 7: REFRESH SCHEMA AND VERIFY
-- =============================================

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT 
  'Services without providers' as issue,
  COUNT(*) as count
FROM services s 
LEFT JOIN service_providers sp ON s.service_provider_id = sp.id
WHERE s.is_active = true AND sp.id IS NULL

UNION ALL

SELECT 
  'Total active services',
  COUNT(*)
FROM services 
WHERE is_active = true;