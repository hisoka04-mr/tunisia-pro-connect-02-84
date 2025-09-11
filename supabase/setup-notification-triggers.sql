-- Setup notification triggers for email notifications
-- This will automatically trigger email notifications when notifications are created

-- Function to trigger email notifications via Edge Function
CREATE OR REPLACE FUNCTION trigger_email_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger email for booking-related notifications
  IF NEW.type IN ('booking_request', 'booking_update') THEN
    -- Call the Edge Function asynchronously using pg_net extension
    -- This requires the pg_net extension to be enabled
    PERFORM
      net.http_post(
        url := (SELECT 'https://' || (SELECT project_ref FROM vault.secrets WHERE name = 'SUPABASE_URL') || '.supabase.co/functions/v1/send-email-notification'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
        ),
        body := jsonb_build_object(
          'notification_id', NEW.id,
          'user_id', NEW.user_id,
          'type', NEW.type,
          'title', NEW.title,
          'message', NEW.message,
          'related_id', NEW.related_id
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS email_notification_trigger ON notifications;
CREATE TRIGGER email_notification_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_notification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated;

-- Note: This trigger will work when pg_net extension is enabled
-- To enable pg_net, run: CREATE EXTENSION IF NOT EXISTS pg_net;
-- The extension allows calling HTTP endpoints from database functions