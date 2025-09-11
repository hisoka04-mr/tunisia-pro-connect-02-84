-- Complete Database Setup and RLS Policies
-- This file creates all necessary tables with proper structure and relationships

-- =============================================
-- TABLE CREATION
-- =============================================

-- Extend auth.users with additional metadata (if needed)
-- The profiles table serves as user profile extension
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Job categories table
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Service providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  location TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  is_approved BOOLEAN DEFAULT false,
  certificate_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  job_category_id UUID REFERENCES job_categories(id),
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  subscription_plan TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  service_provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_hours INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  client_notes TEXT,
  provider_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- FUNCTIONS FOR ROLE DETECTION
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.email() IN (
    'admin@sevigo.com',
    'admin@admin.com', 
    'support@sevigo.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT := 'client'; -- default role
BEGIN
  -- Check if user is admin
  IF is_admin() THEN
    RETURN 'admin';
  END IF;
  
  -- Check if user is a service provider
  IF EXISTS (SELECT 1 FROM service_providers WHERE user_id = auth.uid()) THEN
    RETURN 'service_provider';
  END IF;
  
  -- Default to client
  RETURN 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "job_categories_read_policy" ON job_categories;
DROP POLICY IF EXISTS "job_categories_admin_policy" ON job_categories;
DROP POLICY IF EXISTS "service_providers_own_access" ON service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON service_providers;
DROP POLICY IF EXISTS "service_providers_admin_access" ON service_providers;
DROP POLICY IF EXISTS "services_provider_insert" ON services;
DROP POLICY IF EXISTS "services_provider_update" ON services;
DROP POLICY IF EXISTS "services_provider_delete" ON services;
DROP POLICY IF EXISTS "services_public_read" ON services;
DROP POLICY IF EXISTS "services_admin_access" ON services;
DROP POLICY IF EXISTS "bookings_client_access" ON bookings;
DROP POLICY IF EXISTS "bookings_provider_access" ON bookings;
DROP POLICY IF EXISTS "bookings_admin_access" ON bookings;
DROP POLICY IF EXISTS "reviews_access" ON reviews;

-- PROFILES TABLE POLICIES
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- JOB CATEGORIES TABLE POLICIES
CREATE POLICY "job_categories_read_policy" ON job_categories
  FOR SELECT
  TO authenticated
  USING (true); -- Everyone can read job categories

CREATE POLICY "job_categories_admin_policy" ON job_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- SERVICE PROVIDERS TABLE POLICIES
CREATE POLICY "service_providers_own_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_providers_public_read" ON service_providers
  FOR SELECT
  TO authenticated
  USING (is_approved = true OR user_id = auth.uid() OR is_admin());

CREATE POLICY "service_providers_admin_access" ON service_providers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- SERVICES TABLE POLICIES
CREATE POLICY "services_provider_insert" ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    (get_user_role() = 'service_provider' OR is_admin())
  );

CREATE POLICY "services_provider_update" ON services
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND (get_user_role() = 'service_provider' OR is_admin()))
  WITH CHECK (auth.uid() = user_id AND (get_user_role() = 'service_provider' OR is_admin()));

CREATE POLICY "services_provider_delete" ON services
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND (get_user_role() = 'service_provider' OR is_admin()));

CREATE POLICY "services_public_read" ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true OR auth.uid() = user_id OR is_admin());

CREATE POLICY "services_admin_access" ON services
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- BOOKINGS TABLE POLICIES
CREATE POLICY "bookings_client_access" ON bookings
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "bookings_provider_access" ON bookings
  FOR ALL
  TO authenticated
  USING (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "bookings_admin_access" ON bookings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- REVIEWS TABLE POLICIES
CREATE POLICY "reviews_access" ON reviews
  FOR ALL
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    service_provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    ) OR 
    is_admin()
  )
  WITH CHECK (
    client_id = auth.uid() OR 
    is_admin()
  );

-- =============================================
-- TRIGGERS FOR AUTOMATIC FIELD SETTING
-- =============================================

-- Function to automatically set user_id and service_provider_id
CREATE OR REPLACE FUNCTION set_service_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  sp_id UUID;
BEGIN
  -- Set user_id to current authenticated user
  NEW.user_id = auth.uid();
  
  -- Get service_provider_id for the current user
  SELECT id INTO sp_id FROM service_providers WHERE user_id = auth.uid();
  
  -- Set service_provider_id if user is a service provider
  IF sp_id IS NOT NULL THEN
    NEW.service_provider_id = sp_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for services table
DROP TRIGGER IF EXISTS trigger_set_service_user_fields ON services;
CREATE TRIGGER trigger_set_service_user_fields
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_user_fields();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for public read-only access where appropriate
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON job_categories TO anon;

-- =============================================
-- SEED DATA
-- =============================================

-- Seed job categories if they don't exist
INSERT INTO job_categories (name, description) VALUES
  ('Plumbing', 'Water systems, pipes, and fixtures installation and repair'),
  ('Electrical', 'Electrical installations, repairs, and maintenance'),
  ('Carpentry', 'Wood work, furniture, and construction'),
  ('Painting', 'Interior and exterior painting services'),
  ('Cleaning', 'House and office cleaning services'),
  ('Gardening', 'Landscaping and garden maintenance'),
  ('Tutoring', 'Educational and academic support'),
  ('Photography', 'Event and portrait photography'),
  ('Catering', 'Food services for events and occasions'),
  ('Transportation', 'Moving and delivery services')
ON CONFLICT (name) DO NOTHING;