-- ENSURE SERVICE IMAGES TABLE AND POLICIES ARE SET UP CORRECTLY
-- This creates the service_images table and proper RLS policies

-- =============================================
-- STEP 1: CREATE SERVICE_IMAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_service_images_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_images_service_id ON public.service_images(service_id);
CREATE INDEX IF NOT EXISTS idx_service_images_primary ON public.service_images(service_id, is_primary);

-- =============================================
-- STEP 2: CREATE UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_images_updated_at ON public.service_images;
CREATE TRIGGER update_service_images_updated_at
    BEFORE UPDATE ON public.service_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 3: ENSURE ONLY ONE PRIMARY IMAGE PER SERVICE
-- =============================================
CREATE OR REPLACE FUNCTION ensure_single_primary_service_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If this image is being set as primary, unset all other primary images for this service
    IF NEW.is_primary = true THEN
        UPDATE public.service_images 
        SET is_primary = false 
        WHERE service_id = NEW.service_id 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_service_image_trigger ON public.service_images;
CREATE TRIGGER ensure_single_primary_service_image_trigger
    BEFORE INSERT OR UPDATE ON public.service_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_service_image();

-- =============================================
-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- =============================================
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "service_images_public_read" ON public.service_images;
DROP POLICY IF EXISTS "service_images_owner_manage" ON public.service_images;
DROP POLICY IF EXISTS "Service images are viewable by everyone" ON public.service_images;
DROP POLICY IF EXISTS "Service providers can manage their service images" ON public.service_images;

-- Create new policies
-- Anyone can view service images (public visibility)
CREATE POLICY "service_images_public_read"
ON public.service_images FOR SELECT
USING (true);

-- Service owners can manage their service images
CREATE POLICY "service_images_owner_manage"
ON public.service_images FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM services 
        WHERE services.id = service_images.service_id 
        AND services.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM services 
        WHERE services.id = service_images.service_id 
        AND services.user_id = auth.uid()
    )
);

-- =============================================
-- STEP 5: GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.service_images TO authenticated;
GRANT SELECT ON public.service_images TO anon;

-- =============================================
-- STEP 6: REFRESH SCHEMA CACHE
-- =============================================
NOTIFY pgrst, 'reload schema';

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 
  'Service images table exists' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_images') 
    THEN 'OK - Table exists' 
    ELSE 'ERROR - Table missing' 
  END as status
UNION ALL
SELECT 
  'Service images policies',
  COUNT(*)::text || ' policies created'
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'service_images';