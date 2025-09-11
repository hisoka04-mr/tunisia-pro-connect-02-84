-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view all service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can view all services" ON public.services;
DROP POLICY IF EXISTS "Service providers can insert their own services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view job categories" ON public.job_categories;
DROP POLICY IF EXISTS "Anyone can insert job categories" ON public.job_categories;

-- Create the corrected policies
CREATE POLICY "Users can view all service providers" ON public.service_providers
    FOR SELECT USING (true);

CREATE POLICY "Users can view all services" ON public.services
    FOR SELECT USING (true);

CREATE POLICY "Service providers can insert their own services" ON public.services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.service_providers 
            WHERE id = service_provider_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view job categories" ON public.job_categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert job categories" ON public.job_categories
    FOR INSERT WITH CHECK (true);