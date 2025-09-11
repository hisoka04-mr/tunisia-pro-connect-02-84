-- Setup job categories with service types
-- This ensures job categories exist with proper service_type classification

-- Add service_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_categories' AND column_name='service_type') THEN
    ALTER TABLE job_categories ADD COLUMN service_type TEXT DEFAULT 'onsite' CHECK (service_type IN ('onsite', 'online'));
  END IF;
END $$;

-- Insert basic job categories if they don't exist
INSERT INTO job_categories (name, description, service_type) VALUES 
  -- On-site services
  ('Plumbing', 'Water systems, pipes, and fixtures', 'onsite'),
  ('Electrical', 'Electrical installations and repairs', 'onsite'),
  ('Carpentry', 'Wood work and furniture', 'onsite'),
  ('Painting', 'Interior and exterior painting', 'onsite'),
  ('Cleaning', 'House and office cleaning', 'onsite'),
  ('Gardening', 'Landscaping and maintenance', 'onsite'),
  ('Photography', 'Event and portrait photography', 'onsite'),
  ('Catering', 'Food services for events', 'onsite'),
  ('Transportation', 'Moving and delivery', 'onsite'),
  ('HVAC', 'Heating, ventilation, and air conditioning', 'onsite'),
  ('Appliance Repair', 'Repair of household appliances', 'onsite'),
  
  -- Online services  
  ('Tutoring', 'Educational and academic support', 'online'),
  ('Web Development', 'Website and app development', 'online'),
  ('Graphic Design', 'Visual design and branding', 'online'),
  ('Digital Marketing', 'Online marketing and SEO', 'online'),
  ('Writing', 'Content writing and copywriting', 'online'),
  ('Translation', 'Language translation services', 'online'),
  ('Consulting', 'Business and technical consulting', 'online'),
  ('Data Entry', 'Data processing and entry', 'online'),
  ('Virtual Assistant', 'Administrative support services', 'online'),
  ('IT Support', 'Technical support and troubleshooting', 'online')
ON CONFLICT (name) DO NOTHING;

-- Update existing categories with appropriate service types
UPDATE job_categories SET service_type = 'online' 
WHERE name IN (
  'Tutoring', 'Web Design', 'Web Development', 'Graphic Design', 'Content Creation', 
  'Social Media Management', 'SEO Services', 'Writing Services', 'Digital Marketing',
  'Translation Services', 'Computer Repair', 'Phone Repair', 'Writing',
  'IT Support', 'Data Entry', 'Virtual Assistant', 'Accounting',
  'Bookkeeping', 'Tax Preparation', 'Financial Planning', 'Consulting'
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_categories_service_type ON job_categories(service_type);

-- Add comment for documentation
COMMENT ON COLUMN job_categories.service_type IS 'Type of service: onsite (physical location) or online (remote)';