-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_service_provider_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.service_providers 
    SET 
        rating = (SELECT AVG(rating) FROM public.reviews WHERE service_provider_id = NEW.service_provider_id),
        total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE service_provider_id = NEW.service_provider_id)
    WHERE id = NEW.service_provider_id;
    RETURN NEW;
END;
$$;