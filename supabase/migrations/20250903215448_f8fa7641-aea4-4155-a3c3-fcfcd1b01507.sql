-- Create function to send booking notifications
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  provider_user_id UUID;
  client_name TEXT;
  service_name TEXT;
BEGIN
  -- Get provider user_id and service details
  SELECT sp.user_id, COALESCE(p.first_name || ' ' || p.last_name, 'A client') as client_name, s.business_name
  INTO provider_user_id, client_name, service_name
  FROM service_providers sp
  LEFT JOIN profiles p ON p.id = NEW.client_id
  LEFT JOIN services s ON s.id = NEW.service_id
  WHERE sp.id = NEW.service_provider_id;
  
  -- Create notification for service provider
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id
  ) VALUES (
    provider_user_id,
    'New Booking Request',
    client_name || ' has requested your service: ' || COALESCE(service_name, 'Service'),
    'booking_request',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to notify booking status changes
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
  
  -- Notify client of status change
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_id
    ) VALUES (
      NEW.client_id,
      'Booking Accepted!',
      provider_name || ' has accepted your booking request for ' || COALESCE(service_name, 'their service') || '. You can now chat with them!',
      'booking_accepted',
      NEW.id
    );
  ELSIF NEW.status = 'rejected' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for booking notifications
DROP TRIGGER IF EXISTS booking_created_notification ON public.bookings;
CREATE TRIGGER booking_created_notification
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_created();

DROP TRIGGER IF EXISTS booking_status_notification ON public.bookings;
CREATE TRIGGER booking_status_notification
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();