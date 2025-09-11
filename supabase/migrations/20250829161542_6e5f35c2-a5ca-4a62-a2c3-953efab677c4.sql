-- Fix service photos storage and display issues
-- Ensure service_images table exists with proper RLS policies

-- Create service_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.service_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on service_images
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service images are viewable by everyone" ON public.service_images;
DROP POLICY IF EXISTS "Service providers can manage their service images" ON public.service_images;

-- Create RLS policies for service_images
CREATE POLICY "Anyone can view service images"
ON public.service_images
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service owners can manage their service images"
ON public.service_images
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.service_providers sp ON s.service_provider_id = sp.id
    WHERE s.id = service_images.service_id 
    AND sp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.service_providers sp ON s.service_provider_id = sp.id
    WHERE s.id = service_images.service_id 
    AND sp.user_id = auth.uid()
  )
);

-- Ensure services table has user_id column for easier photo linking
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing services that don't have user_id set
UPDATE public.services 
SET user_id = sp.user_id
FROM public.service_providers sp
WHERE services.service_provider_id = sp.id 
AND services.user_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_images_service_id ON public.service_images(service_id);
CREATE INDEX IF NOT EXISTS idx_service_images_is_primary ON public.service_images(service_id, is_primary) WHERE is_primary = true;