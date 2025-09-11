import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Service, ServiceWithProvider } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PostServiceForm } from "@/components/PostServiceForm";
import { usePermissions } from "@/hooks/usePermissions";
import { getServiceType, getOnSiteCategories, getOnlineCategories } from "@/utils/serviceCategories";

const ServiceListings = () => {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState([0]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  const [jobCategories, setJobCategories] = useState<Tables<'job_categories'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Set location and service from URL parameters on component mount
  useEffect(() => {
    const locationParam = searchParams.get('location');
    const serviceParam = searchParams.get('service');
    
    if (locationParam) {
      setLocation(locationParam);
    }
    
    if (serviceParam && jobCategories.length > 0) {
      // Find matching category by name
      const matchingCategory = jobCategories.find(cat => 
        cat.name.toLowerCase() === serviceParam.toLowerCase()
      );
      if (matchingCategory) {
        setCategory(matchingCategory.id);
      }
    }
  }, [searchParams, jobCategories]);

  // Fetch service providers and job categories
  const fetchData = useCallback(async () => {
    try {
      // Fetch job categories
      const { data: categories } = await supabase
        .from('job_categories')
        .select('*');
      
      if (categories) {
        setJobCategories(categories);
      }

      // Simple query to avoid relationship issues
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (servicesError) {
        console.error("Error fetching services:", servicesError);
        throw servicesError;
      }

      // Process services to add profile data and photos
      const servicesWithProfiles = await Promise.all((servicesData || []).map(async (service) => {
        let profileData = null;
        
        // Get profile data using user_id directly from service
        const userId = service.user_id;
        
        if (userId) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("first_name, last_name, profile_photo_url")
              .eq("id", userId)
              .maybeSingle();
            
            profileData = data;
          } catch (error) {
            console.warn("Could not fetch profile for user:", userId);
          }
        }

        // Try to fetch service photo
        let servicePhoto = null;
        try {
          const { data: photoData } = await supabase
            .from("service_images")
            .select("image_url")
            .eq("service_id", service.id)
            .eq("is_primary", true)
            .maybeSingle();
          
          servicePhoto = photoData?.image_url || null;
        } catch (error) {
          console.warn(`Service photo fetch failed for service ${service.id}:`, error);
        }

        // Ensure we always have provider data - fetch from service_providers table
        let providerData = null;
        if (service.service_provider_id) {
          try {
            const { data: spData } = await supabase
              .from("service_providers")
              .select("*")
              .eq("id", service.service_provider_id)
              .single();
            providerData = spData;
          } catch (error) {
            console.warn(`Could not fetch service provider for service ${service.id}`);
          }
        }
        
        // Create fallback provider data if none exists
        if (!providerData) {
          providerData = {
            id: service.service_provider_id || 'unknown',
            user_id: service.user_id,
            business_name: service.business_name || 'Service Provider',
            business_description: null,
            rating: 0,
            total_reviews: 0,
            profile_photo_url: null,
            is_approved: false,
            job_category_id: service.job_category_id
          };
        }

        return {
          ...service,
          service_providers: providerData,
          profiles: profileData,
          servicePhoto,
          // Add computed fields for easier access
          provider_name: profileData?.first_name 
            ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
            : providerData.business_name || service.business_name || 'Service Provider',
          provider_photo: profileData?.profile_photo_url || providerData.profile_photo_url
        };
      }));

      setServices(servicesWithProfiles as any);
    } catch (error) {
      console.warn('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Set up real-time subscription for new services
  useEffect(() => {
    const channel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'services'
        },
        () => {
          // Refresh services when any change occurs
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Get unique locations from services (memoized)
  const locations = useMemo(
    () => Array.from(new Set(services.map(s => s.location).filter(Boolean))),
    [services]
  );

  // Filter services based on search criteria (memoized for performance)
  const filteredServices = useMemo(() => services.filter((service) => {
    // Always include services, even if service_providers data is missing
    const serviceProvider = service.service_providers;
    
    const matchesCategory = category && category !== "all" ? 
      (serviceProvider?.job_category_id === category || service.job_category_id === category) : true;
    const matchesLocation = location && location !== "all" ? service.location === location : true;
    const matchesAvailability = availability.length === 0 || 
      (availability.includes("verified") && serviceProvider?.is_approved) ||
      (availability.includes("licensed") && serviceProvider?.is_approved);
    
    return matchesCategory && matchesLocation && matchesAvailability;
  }), [services, category, location, availability]);

  // Separate services by type
  const onSiteServices = useMemo(() => 
    filteredServices.filter(service => {
      const category = jobCategories.find(cat => cat.id === service.job_category_id);
      // Use service_type from database if available, fallback to mapping
      if ((category as any)?.service_type) {
        return (category as any).service_type === 'onsite';
      }
      // Fallback to SERVICE_CATEGORIES mapping
      const categoryName = category?.name || '';
      return getServiceType(categoryName) === 'onsite';
    }), [filteredServices, jobCategories]
  );

  const onlineServices = useMemo(() => 
    filteredServices.filter(service => {
      const category = jobCategories.find(cat => cat.id === service.job_category_id);
      // Use service_type from database if available, fallback to mapping
      if ((category as any)?.service_type) {
        return (category as any).service_type === 'online';
      }
      // Fallback to SERVICE_CATEGORIES mapping
      const categoryName = category?.name || '';
      return getServiceType(categoryName) === 'online';
    }), [filteredServices, jobCategories]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        <BrowseServices
          services={filteredServices}
          onSiteServices={onSiteServices}
          onlineServices={onlineServices}
          allServices={services}
          jobCategories={jobCategories}
          loading={loading}
          category={category}
          setCategory={setCategory}
          location={location}
          setLocation={setLocation}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          availability={availability}
          setAvailability={setAvailability}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          onServiceCreated={fetchData}
        />
      </div>
    </div>
  );
};

interface BrowseServicesProps {
  services: ServiceWithProvider[];
  onSiteServices: ServiceWithProvider[];
  onlineServices: ServiceWithProvider[];
  allServices: ServiceWithProvider[];
  jobCategories: Tables<'job_categories'>[];
  loading: boolean;
  category: string;
  setCategory: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  availability: string[];
  setAvailability: (value: string[]) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  onServiceCreated: () => void;
}

const BrowseServices = ({
  services,
  onSiteServices,
  onlineServices,
  allServices,
  jobCategories,
  loading,
  category,
  setCategory,
  location,
  setLocation,
  priceRange,
  setPriceRange,
  availability,
  setAvailability,
  dialogOpen,
  setDialogOpen,
  onServiceCreated,
}: BrowseServicesProps) => {
  const { permissions } = usePermissions();
  const [activeTab, setActiveTab] = useState<'onsite' | 'online'>('onsite');

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Modern Filters Sidebar */}
      <div className="w-full lg:w-1/4">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 p-8 rounded-3xl shadow-2xl mb-8 sticky top-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-bold text-2xl text-foreground mb-1">Filters</h2>
              <p className="text-sm text-muted-foreground">Refine your search</p>
            </div>
            {permissions.canCreateServices && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    Post Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="post-service-description">
                  <DialogHeader>
                    <DialogTitle>Post Your Service</DialogTitle>
                    <DialogDescription id="post-service-description">
                      Fill out the form below to create and publish your service listing
                    </DialogDescription>
                  </DialogHeader>
                  <PostServiceForm onSuccess={() => {
                    setDialogOpen(false);
                    onServiceCreated();
                  }} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-8">
            {/* Category Filter */}
            <div className="space-y-3">
              <Label htmlFor="category" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 bg-background border-border/50 focus:border-primary transition-colors rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border/50 rounded-xl shadow-xl">
                  <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                  {jobCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                Location
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-12 bg-background border-border/50 focus:border-primary transition-colors rounded-xl">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border/50 rounded-xl shadow-xl max-h-64">
                  <SelectItem value="all" className="rounded-lg">All Locations</SelectItem>
                  <SelectItem value="Tunis" className="rounded-lg">Tunis</SelectItem>
                  <SelectItem value="Ariana" className="rounded-lg">Ariana</SelectItem>
                  <SelectItem value="Ben Arous" className="rounded-lg">Ben Arous</SelectItem>
                  <SelectItem value="Manouba" className="rounded-lg">Manouba</SelectItem>
                  <SelectItem value="Nabeul" className="rounded-lg">Nabeul</SelectItem>
                  <SelectItem value="Zaghouan" className="rounded-lg">Zaghouan</SelectItem>
                  <SelectItem value="Bizerte" className="rounded-lg">Bizerte</SelectItem>
                  <SelectItem value="Béja" className="rounded-lg">Béja</SelectItem>
                  <SelectItem value="Jendouba" className="rounded-lg">Jendouba</SelectItem>
                  <SelectItem value="Kef" className="rounded-lg">Kef</SelectItem>
                  <SelectItem value="Siliana" className="rounded-lg">Siliana</SelectItem>
                  <SelectItem value="Kairouan" className="rounded-lg">Kairouan</SelectItem>
                  <SelectItem value="Kasserine" className="rounded-lg">Kasserine</SelectItem>
                  <SelectItem value="Sidi Bouzid" className="rounded-lg">Sidi Bouzid</SelectItem>
                  <SelectItem value="Sousse" className="rounded-lg">Sousse</SelectItem>
                  <SelectItem value="Monastir" className="rounded-lg">Monastir</SelectItem>
                  <SelectItem value="Mahdia" className="rounded-lg">Mahdia</SelectItem>
                  <SelectItem value="Sfax" className="rounded-lg">Sfax</SelectItem>
                  <SelectItem value="Gafsa" className="rounded-lg">Gafsa</SelectItem>
                  <SelectItem value="Tozeur" className="rounded-lg">Tozeur</SelectItem>
                  <SelectItem value="Kebili" className="rounded-lg">Kebili</SelectItem>
                  <SelectItem value="Gabès" className="rounded-lg">Gabès</SelectItem>
                  <SelectItem value="Medenine" className="rounded-lg">Medenine</SelectItem>
                  <SelectItem value="Tataouine" className="rounded-lg">Tataouine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline"
              className="w-full h-12 border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 rounded-xl"
              onClick={() => {
                setCategory("all");
                setLocation("all");
                setPriceRange([0]);
                setAvailability([]);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Service Listings */}
      <div className="w-full lg:w-3/4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : (
          <>
            {/* Service Type Tabs */}
            <div className="mb-8">
              <div className="bg-muted rounded-lg p-1 max-w-md mx-auto mb-6">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('onsite')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'onsite'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      On-site ({onSiteServices.length})
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('online')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'online'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2v10a2 2 0 01-2 2z" />
                      </svg>
                      Online ({onlineServices.length})
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Tab Content */}
            {activeTab === 'onsite' && (
              <section>
                
                {onSiteServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {onSiteServices.map((service) => {
                      const providerName = service.profiles && service.profiles.first_name ? 
                        `${service.profiles.first_name} ${service.profiles.last_name || ''}`.trim() : 
                        service.business_name || 'Service Provider';
                      
                      const category = jobCategories.find(cat => cat.id === (service as any).job_category_id)?.name;
                      
                      return (
                        <ServiceCard
                          key={service.id}
                          id={service.id}
                          title={providerName}
                          description={service.description || 'Professional service provider'}
                          category={category}
                          location={service.location}
                          rating={service.service_providers?.rating}
                          profilePhoto={service.profiles?.profile_photo_url}
                          servicePhoto={(service as any).servicePhoto}
                          price={service.hourly_rate ? `${service.hourly_rate} TND/hour` : undefined}
                          businessName={service.business_name}
                          serviceType="onsite"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No On-Site Services Found</h3>
                    <p className="text-gray-600">Try adjusting your filters to see more services</p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'online' && (
              <section>
                
                {onlineServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {onlineServices.map((service) => {
                      const providerName = service.profiles && service.profiles.first_name ? 
                        `${service.profiles.first_name} ${service.profiles.last_name || ''}`.trim() : 
                        service.business_name || 'Service Provider';
                      
                      const category = jobCategories.find(cat => cat.id === (service as any).job_category_id)?.name;
                      
                      return (
                        <ServiceCard
                          key={service.id}
                          id={service.id}
                          title={providerName}
                          description={service.description || 'Professional service provider'}
                          category={category}
                          location={service.location}
                          rating={service.service_providers?.rating}
                          profilePhoto={service.profiles?.profile_photo_url}
                          servicePhoto={(service as any).servicePhoto}
                          price={service.hourly_rate ? `${service.hourly_rate} TND/hour` : undefined}
                          businessName={service.business_name}
                          serviceType="online"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Online Services Found</h3>
                    <p className="text-gray-600">Try adjusting your filters to see more services</p>
                  </div>
                )}
              </section>
            )}

            {onSiteServices.length === 0 && onlineServices.length === 0 && allServices.length > 0 && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold mt-4">No services match your filters</h3>
                <p className="text-gray-600 mt-2">Try adjusting your filters or search terms</p>
              </div>
            )}

            {allServices.length === 0 && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold mt-4">No services found</h3>
                <p className="text-gray-600 mt-2">Try adjusting your filters or search terms</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceListings;