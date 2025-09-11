// Extended database types for custom tables not in Supabase types
export type AccountType = 'client' | 'onsite_provider' | 'online_provider';

export interface Service {
  id: string;
  service_provider_id: string;
  user_id?: string;
  business_name: string;
  description: string;
  location: string;
  hourly_rate: number | null;
  experience_years: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subscription_plan?: string;
  availability_notes?: string;
  images?: string[];
  job_category_id?: string | null;
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

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface ServiceProviderPreferences {
  id: string;
  user_id: string;
  preferred_service_type: 'onsite' | 'online' | 'both';
  max_travel_distance?: number | null;
  online_platforms?: string[] | null;
  working_hours?: any | null;
  emergency_services: boolean;
  auto_accept_bookings: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithProvider extends Service {
  job_categories?: {
    id: string;
    name: string;
    description: string;
  } | null;
  service_providers: {
    id: string;
    user_id?: string;
    business_name?: string;
    rating: number | null;
    total_reviews: number | null;
    profile_photo_url: string | null;
    is_approved: boolean;
    business_description: string | null;
    experience_years: number | null;
    job_category_id: string | null;
    job_categories: {
      name: string;
    } | null;
    profiles: {
      first_name: string;
      last_name: string;
      profile_photo_url: string | null;
    } | null;
  } | null;
  profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
  } | null;
  service_images?: {
    image_url: string;
    is_primary: boolean;
  }[] | null;
  servicePhoto?: string | null;
}