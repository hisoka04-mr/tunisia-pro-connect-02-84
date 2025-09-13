-- Fix chat system user consistency issues
-- This addresses the "user not found in profiles" errors

-- First, let's clean up any orphaned messages that reference non-existent users
DELETE FROM public.messages 
WHERE sender_id NOT IN (SELECT id FROM auth.users)
   OR recipient_id NOT IN (SELECT id FROM auth.users);

-- Clean up any conversations that reference non-existent users
DELETE FROM public.conversations 
WHERE service_provider_id NOT IN (SELECT id FROM public.service_providers)
   OR client_id NOT IN (SELECT id FROM auth.users);

-- Ensure all authenticated users have profiles
INSERT INTO public.profiles (id, created_at, updated_at)
SELECT 
    u.id,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;