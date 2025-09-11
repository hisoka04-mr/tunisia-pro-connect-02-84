import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

// Use the database types for consistency
type ServiceRow = Database['public']['Tables']['services']['Row'];

// Define a more flexible service type for the fetched data
export interface ServiceWithProvider {
  id: string;
  service_provider_id: string;
  user_id?: string;
  business_name: string;
  description: string;
  location: string;
  hourly_rate: number | null;
  experience_years: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  subscription_plan: string | null;
  availability_notes: string | null;
  images: string[] | null;
  job_category_id: string | null;
  service_providers?: {
    id: string;
    business_name: string;
    profile_photo_url: string | null;
    business_description: string | null;
    rating: number | null;
    total_reviews: number | null;
    user_id: string;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
  } | null;
  job_categories?: {
    id: string;
    name: string;
    description: string;
  } | null;
  servicePhoto?: string | null;
  provider_name?: string;
  provider_photo?: string | null;
}

export const useServices = () => {
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simple query without complex joins to avoid relationship issues
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
        let serviceProviderData = null;
        
        // Fetch service provider data first
        if (service.service_provider_id) {
          try {
            const { data: spData } = await supabase
              .from("service_providers")
              .select("*")
              .eq("id", service.service_provider_id)
              .single();
            serviceProviderData = spData;
          } catch (error) {
            console.warn(`Could not fetch service provider for service ${service.id}`);
          }
        }
        
        // Get profile data using user_id
        const userId = service.user_id || serviceProviderData?.user_id;
        
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

        // Ensure we always have provider data
        const providerData = serviceProviderData || {
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

      console.log("Fetched services with complete provider data:", servicesWithProfiles);
      setServices(servicesWithProfiles as any);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message || "Failed to fetch services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserServices = async () => {
    if (!user) {
      setServices([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch user's services via service_provider relationship
      const { data: serviceProviderData } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (serviceProviderData) {
        const { data, error: servicesError } = await supabase
          .from("services")
          .select("*")
          .eq("service_provider_id", serviceProviderData.id)
          .order("created_at", { ascending: false });

        if (!servicesError && data) {
          setServices(data as ServiceWithProvider[]);
          return;
        }
      }

      // If both methods fail, set empty array
      setServices([]);
    } catch (err: any) {
      console.error("Error fetching user services:", err);
      setError(err.message || "Failed to fetch your services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setServices(prev => prev.filter(service => service.id !== serviceId));
      return true;
    } catch (err: any) {
      console.error("Error deleting service:", err);
      throw err;
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: isActive })
        .eq("id", serviceId);

      if (error) {
        throw error;
      }

      // Update local state
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, is_active: isActive }
            : service
        )
      );
      return true;
    } catch (err: any) {
      console.error("Error updating service status:", err);
      throw err;
    }
  };

  useEffect(() => {
    // Run connection tests first
    const runTests = async () => {
      try {
        // Import the test functions dynamically to avoid circular imports
        const { testDatabaseConnection, testJobCategoriesAccess } = await import("@/utils/testConnection");
        
        console.log("Running database connection tests...");
        const connectionTest = await testDatabaseConnection();
        const categoriesTest = await testJobCategoriesAccess();
        
        console.log("Connection test result:", connectionTest);
        console.log("Categories test result:", categoriesTest);
        
        // If tests pass, fetch services
        if (connectionTest.success) {
          fetchServices();
        } else {
          console.error("Database connection failed, skipping service fetch");
          setError("Database connection failed");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error running connection tests:", error);
        // Fallback to regular fetch
        fetchServices();
      }
    };

    runTests();
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    fetchUserServices,
    deleteService,
    toggleServiceStatus,
    refetch: fetchServices,
  };
};
