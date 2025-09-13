-- Fix booking notification status mismatch
-- Update the notification function to use the correct status values

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  service_name TEXT;
BEGIN
  -- Only send notifications when status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get provider and service details
  SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Service Provider') as provider_name, s.business_name
  INTO provider_name, service_name
  FROM service_providers sp
  LEFT JOIN profiles p ON p.id = sp.user_id
  LEFT JOIN services s ON s.id = NEW.service_id
  WHERE sp.id = NEW.service_provider_id;
  
  -- Notify client of status change - use correct status values
  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_id
    ) VALUES (
      NEW.client_id,
      'Booking Confirmed!',
      provider_name || ' has accepted your booking request for ' || COALESCE(service_name, 'their service') || '. You can now chat with them!',
      'booking_accepted',
      NEW.id
    );
  ELSIF NEW.status = 'declined' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_id
    ) VALUES (
      NEW.client_id,
      'Booking Declined',
      provider_name || ' has declined your booking request for ' || COALESCE(service_name, 'their service') || '.',
      'booking_rejected',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;