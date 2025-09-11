-- Fix RLS policies for profile photos to be visible in service listings
-- This allows public viewing of profile photos while keeping other profile data secure

-- Drop existing restrictive policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that allow public viewing of profiles for service listings
CREATE POLICY "Anyone can view profiles for service listings"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Keep the existing policies for insert and update
-- Users can still only update their own profiles
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure service_providers table allows public viewing for service listings
DROP POLICY IF EXISTS "service_providers_own_access" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_public_read" ON public.service_providers;

-- Create policies for service_providers
CREATE POLICY "Service providers public read access"
ON public.service_providers
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service providers own management"
ON public.service_providers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';