-- Setup automatic notifications for new chat messages

-- Function to create notification when new message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  booking_info RECORD;
  service_info RECORD;
  service_details TEXT;
BEGIN
  -- Get sender profile information
  SELECT first_name, last_name INTO sender_profile
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Get booking information
  SELECT notes, service_id INTO booking_info
  FROM bookings 
  WHERE id = NEW.booking_id;
  
  -- Get service details if service_id exists
  service_details := COALESCE(booking_info.notes, 'Service booking');
  
  IF booking_info.service_id IS NOT NULL THEN
    SELECT description INTO service_info
    FROM services 
    WHERE id = booking_info.service_id;
    
    service_details := COALESCE(service_info.description, booking_info.notes, 'Service booking');
  END IF;
  
  -- Create notification for message recipient
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    is_read
  ) VALUES (
    NEW.recipient_id,
    'Nouveau message',
    CONCAT(sender_profile.first_name, ' ', sender_profile.last_name, ' vous a envoyé un message concernant: ', service_details),
    'new_message',
    NEW.booking_id,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_message_notification() TO authenticated;