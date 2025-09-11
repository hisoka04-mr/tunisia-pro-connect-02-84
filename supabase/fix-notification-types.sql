-- Fix notification types to support booking-related notifications
-- This updates the CHECK constraint to allow booking-related notification types

ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'warning', 'success', 'error', 'booking_request', 'booking_update', 'payment', 'system'));

-- Update the comment for clarity
COMMENT ON COLUMN public.notifications.type IS 'Notification type: info, warning, success, error, booking_request, booking_update, payment, system';