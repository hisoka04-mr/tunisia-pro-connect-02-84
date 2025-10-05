import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ServiceDetails } from "@/components/ServiceDetails";
import { ChatProviderButton } from "@/components/chat/ChatProviderButton";
import { supabase } from "@/integrations/supabase/client";
import { ServiceWithProvider } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, DollarSign, Clock, ArrowRight, Star, Calendar, MessageCircle, Shield, Award } from "lucide-react";

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceWithProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) return;

      try {
        setLoading(true);
        
        // Fetch service data
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("*")
          .eq("id", serviceId)
          .maybeSingle();

        if (serviceError) {
          console.error("Error fetching service:", serviceError);
          return;
        }

        if (!serviceData) {
          console.error("Service not found");
          return;
        }

        // Fetch service provider data
        let serviceProviderData = null;
        if (serviceData.service_provider_id) {
          const { data: spData } = await supabase
            .from("service_providers")
            .select("*")
            .eq("id", serviceData.service_provider_id)
            .maybeSingle();
          serviceProviderData = spData;
        }

        // Fetch profile data
        let profileData = null;
        const userId = serviceData.user_id || serviceProviderData?.user_id;
        
        if (userId) {
          const { data } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_photo_url")
            .eq("id", userId)
            .maybeSingle();
          profileData = data;
        }

        // Fetch job category
        let jobCategoryData = null;
        if (serviceData.job_category_id) {
          const { data } = await supabase
            .from("job_categories")
            .select("*")
            .eq("id", serviceData.job_category_id)
            .maybeSingle();
          jobCategoryData = data;
        }

        const enrichedService = {
          ...serviceData,
          service_providers: serviceProviderData,
          profiles: profileData,
          job_categories: jobCategoryData,
          provider_name: profileData?.first_name 
            ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
            : serviceProviderData?.business_name || serviceData.business_name || 'Service Provider',
          provider_photo: profileData?.profile_photo_url || serviceProviderData?.profile_photo_url
        };

        setService(enrichedService as ServiceWithProvider);
        
        // Check if current user is the owner
        if (user && (serviceData.user_id === user.id || serviceProviderData?.user_id === user.id)) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId, user]);

  const handleBack = () => {
    navigate('/services');
  };

  const handleBookService = () => {
    if (isOwner) {
      // If owner, take them to their bookings/management page
      navigate('/bookings');
    } else {
      // Navigate to booking form with provider ID
      // SmartBookingForm will automatically handle onsite vs online service types
      if (service?.service_provider_id) {
        navigate(`/booking/${service.service_provider_id}`);
      } else {
        console.error('No service provider ID found');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Not Found</h1>
          <p className="text-muted-foreground">The service you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={handleBack} className="p-2 hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">{service.business_name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2 text-lg">
              <MapPin className="h-5 w-5" />
              {service.location}
            </p>
          </div>
          {!isOwner && (
            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
              Available for booking
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Provider Info Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Service Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage 
                      src={service.provider_photo || ""} 
                      alt={service.provider_name || 'Provider'} 
                    />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {(service.provider_name || service.business_name || 'SP')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">
                      {service.provider_name || service.business_name || 'Service Provider'}
                    </h3>
                    {service.service_providers?.business_name && service.provider_name !== service.service_providers.business_name && (
                      <p className="text-muted-foreground mb-3 font-medium">
                        {service.service_providers.business_name}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < Math.floor(service.service_providers?.rating || 0) 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="font-medium">
                          {service.service_providers?.rating || 0}/5
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({service.service_providers?.total_reviews || 0} reviews)
                        </span>
                      </div>
                    </div>

                    {service.job_categories && (
                      <Badge variant="secondary" className="mb-4">
                        {service.job_categories.name}
                      </Badge>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {service.experience_years !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-medium">{service.experience_years} years experience</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{service.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Information Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Description */}
                {service.description && service.description !== 'xx' && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">About This Service</h4>
                    <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                )}

                {/* Availability Notes */}
                {service.availability_notes && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">Availability</h4>
                    <p className="text-muted-foreground">{service.availability_notes}</p>
                  </div>
                )}

                {/* Service Features */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Service Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Professional service</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Same-day available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Verified provider</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Quality guaranteed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Service Details Component */}
            <ServiceDetails 
              service={service}
              onBack={handleBack}
              onBookService={handleBookService}
              isOwner={isOwner}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="shadow-lg border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {service.hourly_rate ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {service.hourly_rate} TND
                    </div>
                    <p className="text-muted-foreground">per hour</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">
                      Quote Based
                    </div>
                    <p className="text-muted-foreground">Contact for pricing</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Card */}
            <Card className="shadow-lg">
              <CardContent className="p-6 space-y-4">
                {!isOwner ? (
                  <>
                    <Button 
                      onClick={handleBookService}
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Now
                    </Button>
                    <ChatProviderButton 
                      providerId={service.service_provider_id || service.user_id || ''}
                      providerName={service.provider_name || service.business_name || 'Service Provider'}
                      size="lg"
                      className="w-full"
                    />
                  </>
                ) : (
                  <Button 
                    onClick={handleBookService}
                    size="lg"
                    className="w-full"
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Manage Service
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{service.location}</span>
                </div>
                {service.experience_years !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium">{service.experience_years} years</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Response time</span>
                  <span className="font-medium">Within 2 hours</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;