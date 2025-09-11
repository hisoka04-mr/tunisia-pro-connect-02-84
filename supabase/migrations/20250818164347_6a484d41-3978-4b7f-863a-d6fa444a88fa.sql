-- Add foreign key constraint between services and service_providers
ALTER TABLE services 
ADD CONSTRAINT fk_service_provider 
FOREIGN KEY (service_provider_id) REFERENCES service_providers(id) ON DELETE CASCADE;