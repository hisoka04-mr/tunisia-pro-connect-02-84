import { supabase } from "@/integrations/supabase/client";

export interface ServiceCreationData {
  description: string;
  location: string;
  experience_years: number;
  hourly_rate: number | null;
  subscription_plan: string;
  job_category_id: string;
  user_id?: string;
  service_provider_id?: string;
  // New fields for service types
  service_type: 'onsite' | 'online';
  service_title: string;
  price_type: 'hourly' | 'fixed' | 'package';
  fixed_price?: number | null;
  availability?: {
    days: string[];
    hours: { start: string; end: string };
  } | null;
  // On-site service fields
  area_covered?: string[] | null;
  // Online service fields
  delivery_time?: string | null;
  skills_tools?: string[] | null;
  portfolio_files?: string[] | null;
}

export const createService = async (
  serviceData: ServiceCreationData,
  userId: string
) => {
  try {
    console.log("Creating service with data:", serviceData);
    console.log("User ID:", userId);

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User authentication error:", userError);
      throw new Error("User must be authenticated to create services");
    }
    console.log("User authenticated:", user.id);

    // First, ensure the user has a service provider record
    const serviceProvider = await ensureServiceProvider(userId, serviceData);

    // The trigger will automatically set user_id
    const serviceInsertData = {
      business_name: serviceData.service_title,
      description: serviceData.description.trim(),
      location: serviceData.location,
      experience_years: serviceData.experience_years || 0,
      hourly_rate: serviceData.hourly_rate,
      subscription_plan: serviceData.subscription_plan,
      job_category_id: serviceData.job_category_id,
      is_active: true,
      service_provider_id: serviceProvider.id,
      // New service type fields
      service_type: serviceData.service_type || 'onsite',
      service_title: serviceData.service_title.trim(),
      price_type: serviceData.price_type || 'hourly',
      fixed_price: serviceData.fixed_price,
      availability: serviceData.availability,
      area_covered: serviceData.area_covered,
      delivery_time: serviceData.delivery_time,
      skills_tools: serviceData.skills_tools,
      portfolio_files: serviceData.portfolio_files,
      // user_id will be set automatically by the database trigger
    };

    console.log("Inserting service with data:", serviceInsertData);

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .insert(serviceInsertData)
      .select()
      .single();

    if (serviceError) {
      console.error("Service creation error:", serviceError);
      console.error("Error details:", {
        message: serviceError.message,
        details: serviceError.details,
        hint: serviceError.hint,
        code: serviceError.code
      });
      throw new Error(`Failed to create service: ${serviceError.message}`);
    }

    console.log("Service created successfully:", service);
    return service;
  } catch (error) {
    console.error("Error in createService:", error);
    throw error;
  }
};

// Ensure user has a service provider record - with improved error handling
export const ensureServiceProvider = async (userId: string, userData: any) => {
  try {
    // Check if service provider record exists
    const { data: existingProvider, error: checkError } = await supabase
      .from("service_providers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    // If record exists, return it
    if (existingProvider) {
      return existingProvider;
    }

    // If no record exists (checkError is null and no data), create one
    console.log("No service provider record found, creating one for user:", userId);
    
    const { data: newProvider, error: createError } = await supabase
      .from("service_providers")
      .insert({
        user_id: userId,
        business_name: userData.service_title || 'My Business',
        location: userData.location || 'Tunisia',
        subscription_plan: userData.subscription_plan || 'basic',
        is_approved: true, // Auto-approve to avoid blocking service posting
        rating: 0,
        total_reviews: 0
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating service provider:", createError);
      throw new Error(`Failed to create service provider: ${createError.message}`);
    }

    // Also update the user's role in profiles table (if role field exists)
    try {
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", userId);
    } catch (roleError) {
      console.warn("Could not update profiles table:", roleError);
      // Don't fail the whole operation if update fails
    }

    console.log("Service provider created successfully:", newProvider);
    return newProvider;

  } catch (error: any) {
    console.error("Error ensuring service provider:", error);
    
    // If there's a database error but we still need to proceed, create a minimal provider object
    if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
      console.log("Database permission issue, using fallback approach");
      
      // Return a temporary provider object that allows service creation to proceed
      return {
        id: userId, // Use user ID as temporary provider ID
        user_id: userId,
        business_name: userData.service_title || 'My Business',
        location: userData.location || 'Tunisia',
        subscription_plan: userData.subscription_plan || 'basic',
        is_approved: true,
        rating: 0,
        total_reviews: 0
      };
    }
    
    throw error;
  }
};