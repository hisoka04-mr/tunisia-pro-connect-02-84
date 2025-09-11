-- Enable RLS if not already enabled
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_providers
CREATE POLICY "Users can view all service providers" ON public.service_providers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own service provider profile" ON public.service_providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service provider profile" ON public.service_providers
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for services
CREATE POLICY "Users can view all services" ON public.services
    FOR SELECT USING (true);

CREATE POLICY "Service providers can insert their own services" ON public.services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.service_providers 
            WHERE id = service_provider_id AND user_id = auth.uid()
        )
    );

-- RLS Policies for job_categories
CREATE POLICY "Anyone can view job categories" ON public.job_categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert job categories" ON public.job_categories
    FOR INSERT WITH CHECK (true);