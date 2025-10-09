-- Allow participants in a booking to view each other's minimal profile info
-- This fixes chat UI showing "User" and missing profile photos due to RLS

-- Ensure RLS is enabled (it already is per schema, but keep for clarity)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow viewing counterpart profiles for bookings the user participates in
DROP POLICY IF EXISTS "Users can view profiles of their chat participants" ON public.profiles;
CREATE POLICY "Users can view profiles of their chat participants"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.service_providers sp ON sp.id = b.service_provider_id
    WHERE 
      -- Current user is client; allow viewing provider's profile
      (b.client_id = auth.uid() AND sp.user_id = public.profiles.id)
      OR
      -- Current user is provider; allow viewing client's profile
      (sp.user_id = auth.uid() AND b.client_id = public.profiles.id)
  )
);

-- Note: Update/Insert policies remain unchanged, only SELECT is broadened narrowly to booking counterparts.