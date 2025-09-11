-- FINAL FIX FOR PROVIDER NOT FOUND ERRORS
-- This ensures every service has complete provider data

-- Update services.user_id from service_providers where missing
UPDATE public.services 
SET user_id = sp.user_id
FROM public.service_providers sp
WHERE services.service_provider_id = sp.id 
  AND services.user_id IS NULL;

-- Create missing service_providers for services that need them
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
SELECT DISTINCT
  s.user_id,
  COALESCE(s.business_name, 'Service Provider') as business_name,
  'basic' as subscription_plan,
  true as is_approved,
  0 as rating,
  0 as total_reviews,
  now() as created_at,
  now() as updated_at
FROM public.services s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.service_providers sp 
    WHERE sp.user_id = s.user_id
  );

-- Link services to their providers
UPDATE public.services 
SET service_provider_id = sp.id
FROM public.service_providers sp
WHERE services.user_id = sp.user_id 
  AND services.service_provider_id IS NULL;

-- Enable public read access for service browsing
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "service_providers_public_read" ON public.service_providers;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (true);
CREATE POLICY "service_providers_public_read" ON public.service_providers FOR SELECT USING (true);  
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';