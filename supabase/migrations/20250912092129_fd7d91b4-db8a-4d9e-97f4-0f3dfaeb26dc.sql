-- Fix notifications type and ensure booking triggers
-- 1) Update CHECK constraint to include booking-related types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'info',
    'booking_request',
    'booking_update',
    'new_message',
    'booking_accepted',
    'booking_rejected'
  ));

-- 2) Ensure triggers exist for notifications on booking create/status change
DROP TRIGGER IF EXISTS trg_notify_booking_created ON public.bookings;
CREATE TRIGGER trg_notify_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_created();

DROP TRIGGER IF EXISTS trg_notify_booking_status_change ON public.bookings;
CREATE TRIGGER trg_notify_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();