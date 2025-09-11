-- Complete fix for service photos and avatar visibility
-- This ensures all photos are properly visible in the application

-- =============================================
-- DISABLE RLS TEMPORARILY FOR SAFE UPDATES
-- =============================================
DO $$ 
BEGIN
    -- Temporarily disable RLS for safe updates
    ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.service_providers DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.service_images DISABLE ROW LEVEL SECURITY;
END $$;

-- =============================================
-- ENSURE SERVICE_IMAGES TABLE EXISTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_images_service_id ON public.service_images(service_id);
CREATE INDEX IF NOT EXISTS idx_service_images_primary ON public.service_images(service_id, is_primary);

-- =============================================
-- ENSURE STORAGE BUCKET IS PROPERLY CONFIGURED
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =============================================
-- DROP ALL EXISTING POLICIES TO START FRESH
-- =============================================

-- Storage policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public profile photos access" ON storage.objects;

-- Table policies
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "service_providers_own_management" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON public.service_providers;
DROP POLICY IF EXISTS "Service providers public read access" ON public.service_providers;
DROP POLICY IF EXISTS "services_owner_management" ON public.services;
DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "service_images_public_read" ON public.service_images;
DROP POLICY IF EXISTS "service_images_owner_manage" ON public.service_images;

-- =============================================
-- CREATE COMPREHENSIVE STORAGE POLICIES
-- =============================================

-- Anyone can view profile photos (public bucket)
CREATE POLICY "Public can view all profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid() IS NOT NULL
    AND (name LIKE auth.uid()::text || '%' OR name LIKE auth.uid()::text || '/%')
);

-- Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-photos' 
    AND auth.uid() IS NOT NULL
    AND (name LIKE auth.uid()::text || '%' OR name LIKE auth.uid()::text || '/%')
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-photos' 
    AND auth.uid() IS NOT NULL
    AND (name LIKE auth.uid()::text || '%' OR name LIKE auth.uid()::text || '/%')
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE LIBERAL PUBLIC READ POLICIES
-- =============================================

-- Profiles: Public read access for everyone
CREATE POLICY "Public read access to profiles"
ON public.profiles FOR SELECT
TO public
USING (true);

-- Profiles: Users can manage their own profiles
CREATE POLICY "Users can manage own profiles"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service Providers: Public read access
CREATE POLICY "Public read access to service providers"
ON public.service_providers FOR SELECT
TO public
USING (true);

-- Service Providers: Users can manage their own provider profiles
CREATE POLICY "Users can manage own service provider profiles"
ON public.service_providers FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Services: Public can read active services
CREATE POLICY "Public read access to active services"
ON public.services FOR SELECT
TO public
USING (is_active = true OR auth.uid() = user_id);

-- Services: Users can manage their own services
CREATE POLICY "Users can manage own services"
ON public.services FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service Images: Public read access to all service images
CREATE POLICY "Public read access to service images"
ON public.service_images FOR SELECT
TO public
USING (true);

-- Service Images: Service owners can manage their service images
CREATE POLICY "Service owners can manage service images"
ON public.service_images FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.services 
        WHERE services.id = service_images.service_id 
        AND services.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.services 
        WHERE services.id = service_images.service_id 
        AND services.user_id = auth.uid()
    )
);

-- =============================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.service_providers TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.service_images TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- UPDATE FUNCTIONS FOR PROFILE SYNC
-- =============================================
CREATE OR REPLACE FUNCTION sync_profile_photos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When profile photo is updated, sync to service_providers
    IF TG_TABLE_NAME = 'profiles' AND OLD.profile_photo_url IS DISTINCT FROM NEW.profile_photo_url THEN
        UPDATE public.service_providers 
        SET profile_photo_url = NEW.profile_photo_url,
            updated_at = now()
        WHERE user_id = NEW.id;
    END IF;
    
    -- When service provider photo is updated, sync to profiles
    IF TG_TABLE_NAME = 'service_providers' AND OLD.profile_photo_url IS DISTINCT FROM NEW.profile_photo_url THEN
        UPDATE public.profiles 
        SET profile_photo_url = NEW.profile_photo_url,
            updated_at = now()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create or replace triggers
DROP TRIGGER IF EXISTS sync_profile_photo_trigger ON public.profiles;
CREATE TRIGGER sync_profile_photo_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_photos();

DROP TRIGGER IF EXISTS sync_service_provider_photo_trigger ON public.service_providers;
CREATE TRIGGER sync_service_provider_photo_trigger
    AFTER UPDATE ON public.service_providers
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_photos();

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION QUERIES (FOR TESTING)
-- =============================================
-- These are commented out but can be uncommented for testing

-- Test storage bucket
-- SELECT * FROM storage.buckets WHERE id = 'profile-photos';

-- Test policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('profiles', 'service_providers', 'services', 'service_images');

-- Test storage policies
-- SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';