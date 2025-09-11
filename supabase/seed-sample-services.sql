-- Seed sample services for testing
-- This script creates sample users, service providers, and services

-- First ensure we have some test users in auth.users (you may need to sign up manually)
-- Create sample service providers and services

-- Insert sample service providers (assuming test users exist)
INSERT INTO service_providers (
    id,
    user_id,
    business_name,
    bio,
    experience_years,
    hourly_rate,
    location,
    subscription_plan,
    is_approved,
    rating,
    total_reviews
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1), -- Use first available user
    'TechSolutions Pro',
    'Professional web development and design services',
    5,
    75.00,
    'Tunis, Tunisia',
    'premium',
    true,
    4.8,
    25
),
(
    gen_random_uuid(),
    (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1), -- Use second user if exists
    'Creative Designs Studio',
    'Logo design and branding specialist',
    3,
    45.00,
    'Sfax, Tunisia',
    'basic',
    true,
    4.6,
    15
),
(
    gen_random_uuid(),
    (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1), -- Fallback to first user
    'Content Creator Hub',
    'Professional content writing and copywriting',
    7,
    60.00,
    'Sousse, Tunisia',
    'premium',
    true,
    4.9,
    40
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample services
INSERT INTO services (
    business_name,
    description,
    location,
    experience_years,
    hourly_rate,
    subscription_plan,
    job_category_id,
    user_id,
    service_provider_id,
    is_active
) 
SELECT 
    'Professional Web Development',
    'Full-stack web development using React, Node.js, and modern technologies. I create responsive, fast, and SEO-optimized websites.',
    'Tunis, Tunisia',
    5,
    75.00,
    'premium',
    (SELECT id FROM job_categories WHERE name = 'Web Development' LIMIT 1),
    sp.user_id,
    sp.id,
    true
FROM service_providers sp 
WHERE sp.business_name = 'TechSolutions Pro'
LIMIT 1;

INSERT INTO services (
    business_name,
    description,
    location,
    experience_years,
    hourly_rate,
    subscription_plan,
    job_category_id,
    user_id,
    service_provider_id,
    is_active
) 
SELECT 
    'Modern Logo Design',
    'Creative logo design and brand identity services. I help businesses create memorable and impactful visual identities.',
    'Sfax, Tunisia',
    3,
    45.00,
    'basic',
    (SELECT id FROM job_categories WHERE name = 'Logo Design' LIMIT 1),
    sp.user_id,
    sp.id,
    true
FROM service_providers sp 
WHERE sp.business_name = 'Creative Designs Studio'
LIMIT 1;

INSERT INTO services (
    business_name,
    description,
    location,
    experience_years,
    hourly_rate,
    subscription_plan,
    job_category_id,
    user_id,
    service_provider_id,
    is_active
) 
SELECT 
    'Professional Content Writing',
    'High-quality content writing services including blog posts, articles, web copy, and SEO content. Native English and French speaker.',
    'Sousse, Tunisia',
    7,
    60.00,
    'premium',
    (SELECT id FROM job_categories WHERE name = 'Article Writing' LIMIT 1),
    sp.user_id,
    sp.id,
    true
FROM service_providers sp 
WHERE sp.business_name = 'Content Creator Hub'
LIMIT 1;

INSERT INTO services (
    business_name,
    description,
    location,
    experience_years,
    hourly_rate,
    subscription_plan,
    job_category_id,
    user_id,
    service_provider_id,
    is_active
) 
SELECT 
    'UI/UX Design Services',
    'User-centered design solutions for web and mobile applications. I specialize in creating intuitive interfaces that enhance user experience.',
    'Tunis, Tunisia',
    4,
    65.00,
    'premium',
    (SELECT id FROM job_categories WHERE name = 'UI/UX Design' LIMIT 1),
    sp.user_id,
    sp.id,
    true
FROM service_providers sp 
WHERE sp.business_name = 'TechSolutions Pro'
LIMIT 1;

INSERT INTO services (
    business_name,
    description,
    location,
    experience_years,
    hourly_rate,
    subscription_plan,
    job_category_id,
    user_id,
    service_provider_id,
    is_active
) 
SELECT 
    'Digital Marketing Expert',
    'Comprehensive digital marketing services including SEO, PPC, content marketing, and social media management to grow your online presence.',
    'Sousse, Tunisia',
    6,
    50.00,
    'premium',
    (SELECT id FROM job_categories WHERE name = 'Digital Marketing' LIMIT 1),
    sp.user_id,
    sp.id,
    true
FROM service_providers sp 
WHERE sp.business_name = 'Content Creator Hub'
LIMIT 1;

-- Create a quick test service for immediate visibility (uses first available user/service_provider)
INSERT INTO services (
    business_name,
    description,
    location,
    experience_years,
    hourly_rate,
    subscription_plan,
    job_category_id,
    user_id,
    service_provider_id,
    is_active
)
SELECT 
    'Quick Test Service',
    'This is a test service to verify the services display functionality works correctly.',
    'Test Location',
    2,
    30.00,
    'basic',
    (SELECT id FROM job_categories LIMIT 1),
    COALESCE((SELECT user_id FROM service_providers LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
    COALESCE((SELECT id FROM service_providers LIMIT 1), gen_random_uuid()),
    true
WHERE EXISTS (SELECT 1 FROM job_categories LIMIT 1);