-- Fix schema cache issue for job_category_id column
-- This forces Supabase to refresh its schema cache

-- Ensure the job_category_id column exists with proper type
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS job_category_id UUID;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE services 
DROP CONSTRAINT IF EXISTS services_job_category_id_fkey;

ALTER TABLE services 
ADD CONSTRAINT services_job_category_id_fkey 
FOREIGN KEY (job_category_id) REFERENCES job_categories(id) ON DELETE CASCADE;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Alternative method to refresh cache
SELECT pg_notify('pgrst', 'reload schema');

-- Update table statistics
ANALYZE services;
ANALYZE job_categories;