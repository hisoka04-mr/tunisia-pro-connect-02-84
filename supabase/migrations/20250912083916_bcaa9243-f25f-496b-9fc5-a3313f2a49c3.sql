-- Fix RLS policies for bookings table
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;

-- Create proper INSERT policy with WITH CHECK condition
CREATE POLICY "Clients can create bookings" 
ON bookings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = client_id);

-- Add foreign key constraints for data integrity
ALTER TABLE bookings 
ADD CONSTRAINT bookings_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_service_provider_id_fkey 
FOREIGN KEY (service_provider_id) REFERENCES service_providers(id) ON DELETE CASCADE;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;