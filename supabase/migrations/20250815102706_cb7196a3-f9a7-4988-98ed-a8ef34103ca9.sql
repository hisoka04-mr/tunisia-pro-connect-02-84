-- Add certificate verification fields to service_providers table
ALTER TABLE public.service_providers 
ADD COLUMN certificate_url TEXT,
ADD COLUMN certificate_status TEXT DEFAULT 'pending' CHECK (certificate_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN certificate_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN admin_notes TEXT,
ADD COLUMN rating NUMERIC(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN is_approved BOOLEAN DEFAULT false,
ADD COLUMN license_verified BOOLEAN DEFAULT false,
ADD COLUMN location TEXT;

-- Create index for better performance on certificate status queries
CREATE INDEX idx_service_providers_certificate_status ON public.service_providers(certificate_status);

-- Create index for location searches
CREATE INDEX idx_service_providers_location ON public.service_providers(location);

-- Update RLS policies to allow admins to manage certificate verification
CREATE POLICY "Admins can view all service providers" 
ON public.service_providers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service provider verification" 
ON public.service_providers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));