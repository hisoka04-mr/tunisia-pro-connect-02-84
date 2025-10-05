import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import OnSiteBookingForm from "@/components/OnSiteBookingForm";
import OnlineBookingForm from "@/components/OnlineBookingForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SmartBookingForm = () => {
  const [serviceType, setServiceType] = useState<'onsite' | 'online' | 'loading'>('loading');
  const [providerData, setProviderData] = useState<{
    id: string;
    name: string;
    categoryName: string;
  } | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { providerId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a service",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const fetchProviderData = async () => {
      if (!providerId) {
        toast({
          title: "Invalid Provider",
          description: "No provider selected",
          variant: "destructive",
        });
        navigate("/services");
        return;
      }

      try {
        // Fetch service provider
        const { data: provider, error: providerError } = await supabase
          .from("service_providers")
          .select("id, user_id, business_name")
          .eq("id", providerId)
          .single();

        if (providerError || !provider) {
          toast({
            title: "Provider Not Found",
            description: "The selected provider could not be found",
            variant: "destructive",
          });
          navigate("/services");
          return;
        }

        // Fetch the provider's services to get the service_type
        const { data: services, error: servicesError } = await supabase
          .from("services")
          .select("service_type, job_categories(name)")
          .eq("service_provider_id", providerId)
          .limit(1)
          .single();

        if (servicesError || !services) {
          toast({
            title: "Service Not Found",
            description: "No services found for this provider",
            variant: "destructive",
          });
          navigate("/services");
          return;
        }

        // Get profile information
        let providerName = provider.business_name || "Service Provider";
        if (provider.user_id) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", provider.user_id)
              .maybeSingle();
            
            if (profile && profile.first_name) {
              providerName = `${profile.first_name} ${profile.last_name || ''}`.trim();
            }
          } catch (profileError) {
            console.warn("Could not fetch profile:", profileError);
          }
        }

        const categoryName = (services as any).job_categories?.name || '';
        const detectedServiceType = services.service_type as 'onsite' | 'online';

        if (!detectedServiceType || (detectedServiceType !== 'onsite' && detectedServiceType !== 'online')) {
          toast({
            title: "Service Type Unknown",
            description: "Unable to determine if this is an on-site or online service",
            variant: "destructive",
          });
          navigate("/services");
          return;
        }

        setProviderData({
          id: provider.id,
          name: providerName,
          categoryName
        });
        setServiceType(detectedServiceType);

      } catch (error) {
        console.error("Error fetching provider data:", error);
        toast({
          title: "Error",
          description: "Failed to load provider information",
          variant: "destructive",
        });
        navigate("/services");
      }
    };

    fetchProviderData();
  }, [providerId, user, navigate, toast]);

  if (serviceType === 'loading' || !providerData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Loading service information...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get pre-filled data from navigation state
  const preselectedDate = location.state?.date;
  const preselectedTime = location.state?.time;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            {serviceType === 'onsite' ? '📍' : '💻'} Réservation Intelligente
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
            {serviceType === 'onsite' ? 'Service' : 'Service'}
            <br />
            <span className="text-primary">
              {serviceType === 'onsite' ? 'à Domicile' : 'en Ligne'}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {serviceType === 'onsite' 
              ? 'Planifiez un rendez-vous pour un service professionnel à votre domicile'
              : 'Soumettez votre projet et recevez des propositions de nos experts'
            }
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold shadow-lg ${
              serviceType === 'onsite' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
            }`}>
              {serviceType === 'onsite' ? '📍 Service à Domicile' : '💻 Service en Ligne'}
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium">
              Catégorie: {providerData.categoryName}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {serviceType === 'onsite' ? (
            <OnSiteBookingForm
              providerId={providerData.id}
              providerName={providerData.name}
              preselectedDate={preselectedDate}
              preselectedTime={preselectedTime}
            />
          ) : (
            <OnlineBookingForm
              providerId={providerData.id}
              providerName={providerData.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartBookingForm;