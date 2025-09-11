-- Complete fix to link photos with service posts and ensure visibility
-- This addresses all photo-related issues in the application

-- =============================================
-- DISABLE RLS TEMPORARILY FOR CLEANUP
-- =============================================
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_images DISABLE ROW LEVEL SECURITY;

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

-- Add updated_at trigger for service_images
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_images_updated_at ON public.service_images;
CREATE TRIGGER update_service_images_updated_at
    BEFORE UPDATE ON public.service_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
DROP POLICY IF EXISTS "Public can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Table policies - profiles
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;
DROP POLICY IF EXISTS "Public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profiles" ON public.profiles;

-- Table policies - service_providers
DROP POLICY IF EXISTS "service_providers_own_management" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON public.service_providers;
DROP POLICY IF EXISTS "Service providers public read access" ON public.service_providers;
DROP POLICY IF EXISTS "Public read access to service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can manage own service provider profiles" ON public.service_providers;

-- Table policies - services
DROP POLICY IF EXISTS "services_owner_management" ON public.services;
DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "Public read access to active services" ON public.services;
DROP POLICY IF EXISTS "Users can manage own services" ON public.services;

-- Table policies - service_images  
DROP POLICY IF EXISTS "service_images_public_read" ON public.service_images;
DROP POLICY IF EXISTS "service_images_owner_manage" ON public.service_images;
DROP POLICY IF EXISTS "Public read access to service images" ON public.service_images;
DROP POLICY IF EXISTS "Service owners can manage service images" ON public.service_images;

-- =============================================
-- CREATE COMPREHENSIVE STORAGE POLICIES
-- =============================================

-- Anyone can view profile photos (public bucket)
CREATE POLICY "Everyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid() IS NOT NULL
    AND (
        name LIKE auth.uid()::text || '%' OR 
        name LIKE auth.uid()::text || '/%' OR
        name LIKE auth.uid()::text || '-%' OR
        name LIKE auth.uid()::text || '.'
    )
);

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-photos' 
    AND auth.uid() IS NOT NULL
    AND (
        name LIKE auth.uid()::text || '%' OR 
        name LIKE auth.uid()::text || '/%' OR
        name LIKE auth.uid()::text || '-%' OR
        name LIKE auth.uid()::text || '.'
    )
);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-photos' 
    AND auth.uid() IS NOT NULL
    AND (
        name LIKE auth.uid()::text || '%' OR 
        name LIKE auth.uid()::text || '/%' OR
        name LIKE auth.uid()::text || '-%' OR
        name LIKE auth.uid()::text || '.'
    )
);

-- =============================================
-- ENABLE RLS AND CREATE LIBERAL TABLE POLICIES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can read profiles (needed for service listings)
CREATE POLICY "Everyone can read profiles"
ON public.profiles FOR SELECT
USING (true);

-- Profiles: Users can manage their own profiles
CREATE POLICY "Users manage own profiles"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service Providers: Everyone can read service providers (needed for service listings)
CREATE POLICY "Everyone can read service providers"
ON public.service_providers FOR SELECT
USING (true);

-- Service Providers: Users can manage their own provider profiles
CREATE POLICY "Users manage own provider profiles"
ON public.service_providers FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Services: Everyone can read active services, users can read all their own services
CREATE POLICY "Everyone can read active services"
ON public.services FOR SELECT
USING (is_active = true OR auth.uid() = user_id);

-- Services: Users can manage their own services
CREATE POLICY "Users manage own services"
ON public.services FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service Images: Everyone can read service images
CREATE POLICY "Everyone can read service images"
ON public.service_images FOR SELECT
USING (true);

-- Service Images: Service owners can manage their service images
CREATE POLICY "Service owners manage service images"
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
-- ENSURE PROFILE_PHOTO_URL COLUMNS EXIST
-- =============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- =============================================
-- CREATE HELPER FUNCTIONS FOR PHOTO SYNC
-- =============================================
CREATE OR REPLACE FUNCTION sync_profile_photo_changes()
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
        
        RAISE LOG 'Synced profile photo from profiles to service_providers for user %', NEW.id;
    END IF;
    
    -- When service provider photo is updated, sync to profiles
    IF TG_TABLE_NAME = 'service_providers' AND OLD.profile_photo_url IS DISTINCT FROM NEW.profile_photo_url THEN
        UPDATE public.profiles 
        SET profile_photo_url = NEW.profile_photo_url,
            updated_at = now()
        WHERE id = NEW.user_id;
        
        RAISE LOG 'Synced profile photo from service_providers to profiles for user %', NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create or replace triggers for photo syncing
DROP TRIGGER IF EXISTS sync_profile_photo_from_profiles ON public.profiles;
CREATE TRIGGER sync_profile_photo_from_profiles
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_photo_changes();

DROP TRIGGER IF EXISTS sync_profile_photo_from_service_providers ON public.service_providers;
CREATE TRIGGER sync_profile_photo_from_service_providers
    AFTER UPDATE ON public.service_providers
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_photo_changes();

-- =============================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Specific grants for storage
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- =============================================
-- CREATE FUNCTION TO ENSURE PRIMARY SERVICE IMAGE
-- =============================================
CREATE OR REPLACE FUNCTION ensure_single_primary_service_image()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- If setting this image as primary, make sure no other images for this service are primary
    IF NEW.is_primary = true THEN
        UPDATE public.service_images 
        SET is_primary = false 
        WHERE service_id = NEW.service_id 
        AND id != NEW.id 
        AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to ensure only one primary image per service
DROP TRIGGER IF EXISTS ensure_single_primary_service_image_trigger ON public.service_images;
CREATE TRIGGER ensure_single_primary_service_image_trigger
    BEFORE INSERT OR UPDATE ON public.service_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_service_image();

-- =============================================
-- REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- TEST QUERIES (commented out for production)
-- =============================================
-- Uncomment these for testing:

-- Test storage bucket configuration
-- SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'profile-photos';

-- Test storage policies
-- SELECT policyname, cmd, qual FROM storage.policies WHERE bucket_id = 'profile-photos';

-- Test table policies  
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('profiles', 'service_providers', 'services', 'service_images')
-- ORDER BY tablename, policyname;

-- Test data visibility
-- SELECT COUNT(*) FROM profiles;
-- SELECT COUNT(*) FROM service_providers;
-- SELECT COUNT(*) FROM services;
-- SELECT COUNT(*) FROM service_images;

-- Test service images with services join
-- SELECT s.business_name, si.image_url, si.is_primary 
-- FROM services s 
-- LEFT JOIN service_images si ON s.id = si.service_id 
-- WHERE s.is_active = true 
-- LIMIT 5;