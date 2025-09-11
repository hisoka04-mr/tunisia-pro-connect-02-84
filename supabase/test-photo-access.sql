-- Test queries to verify photo access is working
-- Run these to debug photo visibility issues

-- Check if storage bucket exists and is public
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'profile-photos';

-- Check storage policies
SELECT policyname, cmd, qual FROM storage.policies WHERE bucket_id = 'profile-photos';

-- Check table policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'service_providers', 'services', 'service_images')
ORDER BY tablename, policyname;

-- Test data access (run as authenticated user)
-- SELECT * FROM profiles LIMIT 5;
-- SELECT * FROM service_providers LIMIT 5;  
-- SELECT * FROM services LIMIT 5;
-- SELECT * FROM service_images LIMIT 5;

-- Check if service_images table exists and has data
SELECT 
    count(*) as total_images,
    count(CASE WHEN is_primary = true THEN 1 END) as primary_images
FROM service_images;

-- Check for any RLS violations
SELECT 
    s.id as service_id,
    s.business_name,
    si.image_url,
    si.is_primary
FROM services s
LEFT JOIN service_images si ON s.id = si.service_id
WHERE s.is_active = true
LIMIT 10;