-- Add account_type to profiles table to distinguish service provider types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='account_type') THEN
    ALTER TABLE profiles ADD COLUMN account_type TEXT DEFAULT 'client' CHECK (account_type IN ('client', 'onsite_provider', 'online_provider'));
  END IF;
END $$;

-- Ensure services table has all service type fields (from existing migration)
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
  
  -- Add price_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='price_type') THEN
    ALTER TABLE services ADD COLUMN price_type TEXT DEFAULT 'hourly' CHECK (price_type IN ('hourly', 'fixed', 'package'));
  END IF;
  
  -- Add fixed_price column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='fixed_price') THEN
    ALTER TABLE services ADD COLUMN fixed_price DECIMAL(10,2);
  END IF;
  
  -- Add availability column if it doesn't exist
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

-- Ensure job_categories has service_type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_categories' AND column_name='service_type') THEN
    ALTER TABLE job_categories ADD COLUMN service_type TEXT DEFAULT 'onsite' CHECK (service_type IN ('onsite', 'online'));
  END IF;
END $$;

-- Create service_provider_preferences table for additional settings
CREATE TABLE IF NOT EXISTS service_provider_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_service_type TEXT DEFAULT 'onsite' CHECK (preferred_service_type IN ('onsite', 'online', 'both')),
  max_travel_distance INTEGER, -- for onsite providers (in km)
  online_platforms TEXT[], -- for online providers
  working_hours JSONB, -- flexible working hours
  emergency_services BOOLEAN DEFAULT false,
  auto_accept_bookings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on service_provider_preferences
ALTER TABLE service_provider_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_provider_preferences
CREATE POLICY "Users can view their own preferences" 
ON service_provider_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON service_provider_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update existing services to have service_title if they don't have one
UPDATE services 
SET service_title = business_name 
WHERE service_title IS NULL OR service_title = '';

-- Update job categories with service types
UPDATE job_categories SET service_type = 'online' 
WHERE name IN (
  'Tutoring', 'Web Development', 'Graphic Design', 'Digital Marketing', 
  'Writing', 'Translation', 'Consulting', 'Data Entry', 'Virtual Assistant', 
  'IT Support', 'SEO Services', 'Content Creation', 'Social Media Management'
);

-- Insert missing job categories if they don't exist
INSERT INTO job_categories (name, description, service_type) VALUES 
  ('Web Development', 'Website and app development', 'online'),
  ('Graphic Design', 'Visual design and branding', 'online'),
  ('Digital Marketing', 'Online marketing and SEO', 'online'),
  ('Virtual Assistant', 'Administrative support services', 'online'),
  ('IT Support', 'Technical support and troubleshooting', 'online'),
  ('Plumbing', 'Water systems, pipes, and fixtures', 'onsite'),
  ('Electrical', 'Electrical installations and repairs', 'onsite'),
  ('Cleaning', 'House and office cleaning', 'onsite'),
  ('Gardening', 'Landscaping and maintenance', 'onsite'),
  ('HVAC', 'Heating, ventilation, and air conditioning', 'onsite')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_job_categories_service_type ON job_categories(service_type);
CREATE INDEX IF NOT EXISTS idx_service_provider_preferences_user_id ON service_provider_preferences(user_id);

-- Add comments for documentation
COMMENT ON COLUMN profiles.account_type IS 'Type of account: client, onsite_provider, or online_provider';
COMMENT ON COLUMN services.service_type IS 'Type of service: onsite (physical location) or online (remote)';
COMMENT ON TABLE service_provider_preferences IS 'Additional preferences and settings for service providers';