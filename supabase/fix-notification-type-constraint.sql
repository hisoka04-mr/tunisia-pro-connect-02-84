-- Fix notification type constraint to allow booking-related types
-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint that includes the notification types used in the application
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'booking_request',
  'booking_update', 
  'booking_confirmation',
  'message',
  'system',
  'reminder',
  'general'
));

-- Verify the constraint is working
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'notifications_type_check';