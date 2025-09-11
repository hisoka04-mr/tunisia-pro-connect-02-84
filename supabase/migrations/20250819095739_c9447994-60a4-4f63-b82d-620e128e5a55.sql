-- Add proper foreign key relationships
-- 1. Add foreign key from bookings to service_providers
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_service_provider 
FOREIGN KEY (service_provider_id) REFERENCES service_providers(id);

-- 2. Add foreign key from bookings to services
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_service 
FOREIGN KEY (service_id) REFERENCES services(id);

-- 3. Add foreign key from bookings to profiles (client_id)
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_client 
FOREIGN KEY (client_id) REFERENCES profiles(id);

-- 4. Add foreign key from services to service_providers
ALTER TABLE services 
ADD CONSTRAINT fk_services_service_provider 
FOREIGN KEY (service_provider_id) REFERENCES service_providers(id);

-- 5. Add foreign key from service_providers to profiles
ALTER TABLE service_providers 
ADD CONSTRAINT fk_service_providers_user 
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- 6. Add foreign key from service_providers to job_categories
ALTER TABLE service_providers 
ADD CONSTRAINT fk_service_providers_job_category 
FOREIGN KEY (job_category_id) REFERENCES job_categories(id);

-- 7. Add foreign key from reviews to bookings
ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_booking 
FOREIGN KEY (booking_id) REFERENCES bookings(id);

-- 8. Add foreign key from reviews to service_providers
ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_service_provider 
FOREIGN KEY (service_provider_id) REFERENCES service_providers(id);

-- 9. Add foreign key from reviews to profiles (client_id)
ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_client 
FOREIGN KEY (client_id) REFERENCES profiles(id);

-- 10. Add foreign key from service_images to services
ALTER TABLE service_images 
ADD CONSTRAINT fk_service_images_service 
FOREIGN KEY (service_id) REFERENCES services(id);

-- 11. Add foreign key from messages (sender_id and recipient_id)
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_sender 
FOREIGN KEY (sender_id) REFERENCES profiles(id);

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_recipient 
FOREIGN KEY (recipient_id) REFERENCES profiles(id);

-- 12. Add foreign key from messages to bookings
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_booking 
FOREIGN KEY (booking_id) REFERENCES bookings(id);

-- 13. Add foreign key from notifications to profiles
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_user 
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- 14. Add foreign key from payments to bookings
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_booking 
FOREIGN KEY (booking_id) REFERENCES bookings(id);

-- 15. Add foreign key from availability to service_providers
ALTER TABLE availability 
ADD CONSTRAINT fk_availability_service_provider 
FOREIGN KEY (service_provider_id) REFERENCES service_providers(id);