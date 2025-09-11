-- Update job_categories table with service_type column and comprehensive categories
-- First, add service_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_categories' AND column_name='service_type') THEN
    ALTER TABLE job_categories ADD COLUMN service_type TEXT DEFAULT 'onsite' CHECK (service_type IN ('onsite', 'online'));
  END IF;
END $$;

-- Clear existing basic categories and insert comprehensive list
TRUNCATE job_categories RESTART IDENTITY CASCADE;

-- Insert comprehensive job categories with service types
INSERT INTO job_categories (name, description, service_type) VALUES 
  -- Online Service Providers - Writing & Content Creation
  ('Article Writing', 'Professional article writing services', 'online'),
  ('Blogging', 'Blog content creation and management', 'online'),
  ('Copywriting', 'Marketing and sales copy writing', 'online'),
  ('SEO Writing', 'Search engine optimized content writing', 'online'),
  ('Technical Writing', 'Technical documentation and manuals', 'online'),

  -- Online Service Providers - Graphic Design & Multimedia
  ('Logo Design', 'Professional logo and brand identity design', 'online'),
  ('Web Design', 'Website design and user interface creation', 'online'),
  ('Video Editing', 'Professional video editing and post-production', 'online'),
  ('3D Modeling', '3D modeling and rendering services', 'online'),
  ('UI/UX Design', 'User interface and experience design', 'online'),

  -- Online Service Providers - Photography & Videography
  ('Photo Editing', 'Professional photo editing and retouching', 'online'),
  ('Product Photography', 'Commercial product photography', 'online'),
  ('Stock Photography', 'Stock photo creation and licensing', 'online'),

  -- Online Service Providers - Music & Audio Production
  ('Voice Over', 'Professional voice over services', 'online'),
  ('Sound Design', 'Audio design and sound effects creation', 'online'),
  ('Music Composition', 'Original music composition and scoring', 'online'),
  ('Podcast Production', 'Podcast editing and production services', 'online'),

  -- Online Service Providers - Translation & Transcription
  ('Document Translation', 'Professional document translation services', 'online'),
  ('Audio Transcription', 'Audio to text transcription services', 'online'),
  ('Subtitling', 'Video subtitling and captioning services', 'online'),

  -- Online Service Providers - Tech & Development
  ('Web Development', 'Website and web application development', 'online'),
  ('Mobile App Development', 'iOS and Android app development', 'online'),
  ('Software Development', 'Custom software development services', 'online'),
  ('Cybersecurity', 'Cybersecurity consulting and services', 'online'),
  ('Data Analysis & AI', 'Data analysis and AI development services', 'online'),

  -- Online Service Providers - Marketing & Sales
  ('Digital Marketing', 'SEO, PPC, and digital marketing services', 'online'),
  ('Social Media Management', 'Social media strategy and management', 'online'),
  ('Affiliate Marketing', 'Affiliate marketing and promotion services', 'online'),
  ('Brand Strategy', 'Brand development and strategy consulting', 'online'),

  -- Online Service Providers - Consulting
  ('Business Consulting', 'Business strategy and consulting services', 'online'),
  ('HR Consulting', 'Human resources consulting and services', 'online'),
  ('Legal Consulting', 'Legal advice and consulting services', 'online'),
  ('Financial Consulting', 'Financial planning and consulting services', 'online'),

  -- Online Service Providers - Education & Tutoring
  ('Online Tutoring', 'Remote tutoring and educational support', 'online'),
  ('Course Creation', 'Online course development and creation', 'online'),
  ('Career Coaching', 'Career development and coaching services', 'online'),

  -- Online Service Providers - Administrative Services
  ('Virtual Assistant', 'Remote administrative assistance services', 'online'),
  ('Data Entry', 'Data entry and processing services', 'online'),
  ('Customer Support', 'Remote customer support services', 'online'),

  -- Online Service Providers - Health & Wellness
  ('Nutrition Consulting', 'Online nutrition counseling and meal planning', 'online'),
  ('Personal Training (Online)', 'Online personal training and fitness coaching', 'online'),
  ('Mental Health Counseling', 'Online mental health counseling services', 'online'),

  -- Onsite Service Providers - Trades & Construction
  ('Plumbing', 'Plumbing installation and repair services', 'onsite'),
  ('Electrical Services', 'Electrical installation and repair services', 'onsite'),
  ('HVAC Services', 'Heating, ventilation, and air conditioning services', 'onsite'),
  ('Carpentry', 'Wood working and carpentry services', 'onsite'),
  ('Painting & Decorating', 'Interior and exterior painting services', 'onsite'),

  -- Onsite Service Providers - Cleaning & Maintenance
  ('House Cleaning', 'Residential cleaning and maintenance services', 'onsite'),
  ('Office Cleaning', 'Commercial office cleaning services', 'onsite'),
  ('Carpet Cleaning', 'Professional carpet cleaning services', 'onsite'),
  ('Pressure Washing', 'Exterior pressure washing services', 'onsite'),

  -- Onsite Service Providers - Landscaping & Gardening
  ('Lawn Care', 'Lawn mowing and maintenance services', 'onsite'),
  ('Gardening', 'Garden design and maintenance services', 'onsite'),
  ('Tree Trimming', 'Tree trimming and removal services', 'onsite'),

  -- Onsite Service Providers - Pest Control
  ('Pest Extermination', 'General pest control and extermination', 'onsite'),
  ('Rodent Control', 'Rodent control and prevention services', 'onsite'),
  ('Termite Inspection', 'Termite inspection and treatment services', 'onsite'),

  -- Onsite Service Providers - Personal Services
  ('Haircutting & Styling', 'Professional hair cutting and styling services', 'onsite'),
  ('Makeup Artist', 'Professional makeup and beauty services', 'onsite'),
  ('Manicure/Pedicure', 'Nail care and beauty services', 'onsite'),

  -- Onsite Service Providers - Event Planning & Coordination
  ('Weddings', 'Wedding planning and coordination services', 'onsite'),
  ('Corporate Events', 'Corporate event planning and management', 'onsite'),
  ('Party Planning', 'Party and celebration planning services', 'onsite'),

  -- Onsite Service Providers - Transportation & Delivery
  ('Moving Services', 'Residential and commercial moving services', 'onsite'),
  ('Chauffeur Services', 'Professional chauffeur and driving services', 'onsite'),
  ('Parcel Delivery', 'Package and parcel delivery services', 'onsite'),

  -- Onsite Service Providers - Healthcare & Medical
  ('Home Healthcare', 'In-home healthcare and medical services', 'onsite'),
  ('Nursing Services', 'Professional nursing and care services', 'onsite'),
  ('Physical Therapy', 'In-home physical therapy services', 'onsite'),

  -- Onsite Service Providers - Legal & Administrative
  ('Notary Public', 'Notary public and document authentication', 'onsite'),
  ('Legal Advice', 'In-person legal consultation services', 'onsite'),
  ('Document Filing', 'Legal document filing and processing', 'onsite'),

  -- Onsite Service Providers - Fitness & Personal Training
  ('Personal Trainer', 'In-person personal training services', 'onsite'),
  ('Yoga Instructor', 'Yoga instruction and classes', 'onsite'),
  ('Pilates Instructor', 'Pilates instruction and classes', 'onsite');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_categories_service_type ON job_categories(service_type);

-- Add comment for documentation
COMMENT ON COLUMN job_categories.service_type IS 'Type of service: onsite (physical location) or online (remote)';