-- Fix service_providers table to include missing business_name column
-- This addresses the PGRST204 error when creating service providers

-- Add missing columns to service_providers table
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Ensure rating column exists and has correct type
DO $$
BEGIN
    -- Check if rating column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_providers' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE service_providers ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
    END IF;
END $$;

-- Update any existing service_providers to have default values for new columns
UPDATE service_providers 
SET 
    business_name = COALESCE(business_name, 'My Business'),
    subscription_plan = COALESCE(subscription_plan, 'basic'),
    experience_years = COALESCE(experience_years, 0),
    total_reviews = COALESCE(total_reviews, 0),
    rating = COALESCE(rating, 0.00)
WHERE business_name IS NULL OR subscription_plan IS NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';