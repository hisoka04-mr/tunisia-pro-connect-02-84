-- Add service_type column to job_categories table
-- This will allow proper separation between onsite and online service categories

-- Add service_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_categories' AND column_name='service_type') THEN
    ALTER TABLE job_categories ADD COLUMN service_type TEXT DEFAULT 'onsite' CHECK (service_type IN ('onsite', 'online'));
  END IF;
END $$;

-- Update existing categories with appropriate service types
UPDATE job_categories SET service_type = 'online' 
WHERE name IN (
  'Tutoring', 'Web Design', 'Graphic Design', 'Content Creation', 
  'Social Media Management', 'SEO Services', 'Writing Services', 
  'Translation Services', 'Computer Repair', 'Phone Repair', 
  'IT Support', 'Data Entry', 'Virtual Assistant', 'Accounting',
  'Bookkeeping', 'Tax Preparation', 'Financial Planning'
);

-- All other categories remain as 'onsite' (the default)

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_categories_service_type ON job_categories(service_type);

-- Add comment for documentation
COMMENT ON COLUMN job_categories.service_type IS 'Type of service: onsite (physical location) or online (remote)';