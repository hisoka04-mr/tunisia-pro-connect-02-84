import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ServiceProviderProfile from "@/components/ServiceProviderProfile";
import ServiceDetails from "@/components/ServiceDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BookingCalendar from "@/components/BookingCalendar";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, UserPlus } from "lucide-react";

const ServiceProviderDetails = () => {
  const { providerId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const handleAuthRedirect = (action: 'login' | 'signup') => {
    navigate('/auth', { 
      state: { 
        tab: action,
        returnTo: `/provider/${providerId}`,
        message: "Please sign up or log in to book services"
      }
    });
  };

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      console.log('Fetching provider data for ID:', providerId);
      
      // Fetch service provider details with correct relationship syntax
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select(`
          *,
          profiles (first_name, last_name, profile_photo_url),
          job_categories (id, name, description)
        `)
        .eq('id', providerId)
        .single();

      if (providerError) {
        console.error('Provider fetch error:', providerError);
        throw providerError;
      }

      if (!providerData) {
        console.error('No provider data found for ID:', providerId);
        throw new Error('Provider not found');
      }

      console.log('Provider data fetched successfully:', providerData);

      // Fetch services for this provider with enhanced data
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          job_categories (id, name, description),
          service_images (image_url, is_primary)
        `)
        .eq('service_provider_id', providerId)
        .eq('is_active', true);

      if (servicesError) {
        console.warn('Services fetch error:', servicesError);
      }

      // Fetch reviews for this provider (with fallback for missing reviews table)
      let reviewsData = [];
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles (first_name, last_name)
          `)
          .eq('service_provider_id', providerId)
          .order('created_at', { ascending: false });

        if (!reviewsError && reviews) {
          reviewsData = reviews;
        }
      } catch (reviewError) {
        console.warn('Reviews table might not exist:', reviewError);
      }

      setProvider(providerData);
      setServices(servicesData || []);
      setReviews(reviewsData);
      
      // Automatically select the first service if available
      if (servicesData && servicesData.length > 0) {
        setSelectedService(servicesData[0]);
      }
    } catch (error: any) {
      console.error('Error fetching provider data:', error);
      
      // Better error handling based on error type
      let errorMessage = "Failed to load service provider details";
      if (error.message === 'Provider not found') {
        errorMessage = "Service provider not found";
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Network connection error. Please check your internet connection.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service provider...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Service Provider Not Found</h1>
          <p className="text-gray-600 mt-2">
            The service provider you're looking for doesn't exist or there was a connection error.
          </p>
          <p className="text-sm text-gray-500 mt-1">Provider ID: {providerId}</p>
          <div className="mt-4 space-x-4">
            <Button onClick={() => navigate('/')} variant="default">
              Go Back Home
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBookingComplete = (booking: { date: Date; time: string; providerId: string }) => {
    const providerName = provider.profiles ? 
      `${provider.profiles.first_name} ${provider.profiles.last_name}` : 
      'Service Provider';
      
    toast({
      title: "Appointment Selected",
      description: `Your appointment with ${providerName} has been set for ${booking.date.toLocaleDateString()} at ${booking.time}`,
    });
    
    // Navigate to booking form with pre-filled data
    navigate("/booking", { 
      state: { 
        providerId: booking.providerId,
        providerName,
        date: booking.date,
        time: booking.time
      } 
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ServiceProviderProfile 
        id={provider.id}
        name={provider.profiles ? `${provider.profiles.first_name} ${provider.profiles.last_name}` : 'Service Provider'}
        profession={provider.job_categories?.name || 'Service Professional'}
        rating={provider.rating || 0}
        completedJobs={provider.total_reviews || 0}
        image={provider.profile_photo_url}
        bio={provider.business_description || 'Professional service provider'}
        hourlyRate={40}
        languages={["Arabic", "French"]}
      />

      <div className="mt-8 mb-12">
        <Tabs defaultValue="service">
          <TabsList className="mb-6">
            <TabsTrigger value="service">Service Details</TabsTrigger>
            <TabsTrigger value="cv">CV</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="booking">Book Now</TabsTrigger>
          </TabsList>

          <TabsContent value="service" className="space-y-6">
            {selectedService ? (
              <ServiceDetails
                service={selectedService}
                onBack={() => navigate('/')}
                onBookService={() => setShowCalendar(true)}
                isOwner={user?.id === provider?.user_id}
              />
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Services Available</h3>
                  <p className="text-gray-500">This provider hasn't added any services yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cv">
            <Card>
              <CardHeader>
                <CardTitle>Provider CV</CardTitle>
              </CardHeader>
              <CardContent>
                {provider.certificate_url ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">View the service provider's curriculum vitae:</p>
                    <Button 
                      onClick={() => window.open(provider.certificate_url, '_blank')}
                      className="w-full md:w-auto"
                    >
                      📄 View CV
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No CV available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Client Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.length > 0 ? reviews.map(review => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-semibold">
                        {review.profiles ? `${review.profiles.first_name} ${review.profiles.last_name}` : 'Anonymous'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                )) : (
                  <p className="text-gray-600 text-center py-4">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking">
            {user ? (
              <BookingCalendar
                providerId={provider.id}
                providerName={provider.profiles ? `${provider.profiles.first_name} ${provider.profiles.last_name}` : 'Service Provider'}
                providerPhoto={provider.profile_photo_url}
                onBookingComplete={handleBookingComplete}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Book an appointment</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Sign up to book services</h3>
                      <p className="text-muted-foreground mb-6">
                        Create an account or log in to book appointments with service providers.
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button 
                        onClick={() => handleAuthRedirect('signup')}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Sign Up Free
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleAuthRedirect('login')}
                        className="flex items-center gap-2"
                      >
                        <LogIn className="h-4 w-4" />
                        Log In
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceProviderDetails;