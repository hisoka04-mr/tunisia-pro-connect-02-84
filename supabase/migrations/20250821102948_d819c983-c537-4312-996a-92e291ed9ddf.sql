-- Add job_category_id column to services table
ALTER TABLE services ADD COLUMN job_category_id UUID REFERENCES job_categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_job_category_id ON services(job_category_id);

-- Update existing services to have a default job category (optional)
-- You can run this if you want to assign a default category to existing services
-- UPDATE services SET job_category_id = (SELECT id FROM job_categories LIMIT 1) WHERE job_category_id IS NULL;