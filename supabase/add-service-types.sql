-- Add service types support to services table
-- This migration adds fields to support both on-site and online services

-- Add service_type enum and new fields to services table
DO $$ 
BEGIN
  -- Add service_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='service_type') THEN
    ALTER TABLE services ADD COLUMN service_type TEXT DEFAULT 'onsite' CHECK (service_type IN ('onsite', 'online'));
  END IF;
  
  -- Add service_title column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='service_title') THEN
    ALTER TABLE services ADD COLUMN service_title TEXT;
  END IF;
  
  -- Add price_type column if it doesn't exist (hourly, fixed, package)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='price_type') THEN
    ALTER TABLE services ADD COLUMN price_type TEXT DEFAULT 'hourly' CHECK (price_type IN ('hourly', 'fixed', 'package'));
  END IF;
  
  -- Add fixed_price column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='fixed_price') THEN
    ALTER TABLE services ADD COLUMN fixed_price DECIMAL(10,2);
  END IF;
  
  -- Add availability column if it doesn't exist (JSON field for days/hours)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='availability') THEN
    ALTER TABLE services ADD COLUMN availability JSONB;
  END IF;
  
  -- Add area_covered column if it doesn't exist (for on-site services)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='area_covered') THEN
    ALTER TABLE services ADD COLUMN area_covered TEXT[];
  END IF;
  
  -- Add delivery_time column if it doesn't exist (for online services)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='delivery_time') THEN
    ALTER TABLE services ADD COLUMN delivery_time TEXT;
  END IF;
  
  -- Add skills_tools column if it doesn't exist (for online services)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='skills_tools') THEN
    ALTER TABLE services ADD COLUMN skills_tools TEXT[];
  END IF;
  
  -- Add portfolio_files column if it doesn't exist (for online services)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='portfolio_files') THEN
    ALTER TABLE services ADD COLUMN portfolio_files TEXT[];
  END IF;

END $$;

-- Update existing services to have service_title if they don't have one
UPDATE services 
SET service_title = business_name 
WHERE service_title IS NULL OR service_title = '';

-- Add comments for documentation
COMMENT ON COLUMN services.service_type IS 'Type of service: onsite (physical location) or online (remote)';
COMMENT ON COLUMN services.service_title IS 'Title of the specific service offered';
COMMENT ON COLUMN services.price_type IS 'Pricing model: hourly, fixed, or package';
COMMENT ON COLUMN services.fixed_price IS 'Fixed price for the service (when price_type is fixed or package)';
COMMENT ON COLUMN services.availability IS 'JSON object containing availability schedule';
COMMENT ON COLUMN services.area_covered IS 'Array of areas/locations covered (for onsite services)';
COMMENT ON COLUMN services.delivery_time IS 'Expected delivery timeframe (for online services)';
COMMENT ON COLUMN services.skills_tools IS 'Array of skills and tools used (for online services)';
COMMENT ON COLUMN services.portfolio_files IS 'Array of portfolio/example file URLs (for online services)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_price_type ON services(price_type);