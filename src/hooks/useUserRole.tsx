import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isAdminEmail } from "@/utils/adminConfig";

// Extended profile type to include profile_photo_url
interface ExtendedProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_photo_url?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Extended service provider type to include profile_photo_url in nested profiles
interface ExtendedServiceProvider {
  id: string;
  profile_photo_url: string | null;
  is_approved: boolean | null;
  profiles?: ExtendedProfile | null;
}

export type UserRole = "admin" | "service_provider" | "client" | null;

interface UserProfile {
  id: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  service_provider_id?: string;
  is_approved?: boolean;
  profile_photo_url?: string;
}

interface UserRoleContextType {
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isServiceProvider: boolean;
  isClient: boolean;
  checkServiceOwnership: (serviceProviderId: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider = ({ children }: UserRoleProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      // First, check if user is an admin (check if email is in admin list)
      if (user?.email && isAdminEmail(user.email)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single() as { data: ExtendedProfile | null };
        
        setUserProfile({
          id: userId,
          role: "admin",
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          phone: profile?.phone,
          profile_photo_url: profile?.profile_photo_url,
        });
        return;
      }

      // Try to determine role from user metadata first (fallback)
      let roleFromMetadata: UserRole = "client";
      if (user?.user_metadata?.user_type === "service_provider") {
        roleFromMetadata = "service_provider";
      }

      // Try to check if user is a service provider (with error handling)
        try {
        const { data: serviceProvider, error } = await supabase
          .from("service_providers")
          .select("*, profiles(*)")
          .eq("user_id", userId)
          .single() as { data: ExtendedServiceProvider | null; error: any };

        if (!error && serviceProvider) {
          setUserProfile({
            id: userId,
            role: "service_provider",
            first_name: serviceProvider.profiles?.first_name,
            last_name: serviceProvider.profiles?.last_name,
            phone: serviceProvider.profiles?.phone,
            service_provider_id: serviceProvider.id,
            is_approved: serviceProvider.is_approved,
            profile_photo_url: serviceProvider.profile_photo_url || serviceProvider.profiles?.profile_photo_url,
          });
          return;
        }
      } catch (serviceProviderError) {
        console.warn("Could not access service_providers table, using fallback logic:", serviceProviderError);
        
        // If we can't access service_providers table but metadata says service_provider,
        // still treat as service provider
        if (roleFromMetadata === "service_provider") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single() as { data: ExtendedProfile | null };

          setUserProfile({
            id: userId,
            role: "service_provider",
            first_name: profile?.first_name || user?.user_metadata?.first_name,
            last_name: profile?.last_name || user?.user_metadata?.last_name,
            phone: profile?.phone || user?.user_metadata?.phone,
            service_provider_id: userId, // Use user ID as fallback
            is_approved: false, // Default to not approved if we can't check
            profile_photo_url: profile?.profile_photo_url,
          });
          return;
        }
      }

      // Default to client
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single() as { data: ExtendedProfile | null };

      setUserProfile({
        id: userId,
        role: roleFromMetadata,
        first_name: profile?.first_name || user?.user_metadata?.first_name,
        last_name: profile?.last_name || user?.user_metadata?.last_name,
        phone: profile?.phone || user?.user_metadata?.phone,
        profile_photo_url: profile?.profile_photo_url,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      // Final fallback: use user metadata
      const roleFromMetadata: UserRole = user?.user_metadata?.user_type === "service_provider" ? "service_provider" : "client";
      
      setUserProfile({
        id: userId,
        role: roleFromMetadata,
        first_name: user?.user_metadata?.first_name,
        last_name: user?.user_metadata?.last_name,
        phone: user?.user_metadata?.phone,
        service_provider_id: roleFromMetadata === "service_provider" ? userId : undefined,
        is_approved: false,
        profile_photo_url: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserProfile(user.id);
    } else if (!user) {
      setUserProfile(null);
      setLoading(false);
    }
  }, [user, authLoading]);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const checkServiceOwnership = (serviceProviderId: string): boolean => {
    return userProfile?.service_provider_id === serviceProviderId;
  };

  const value = {
    userProfile,
    role: userProfile?.role || null,
    loading: loading || authLoading,
    isAdmin: userProfile?.role === "admin",
    isServiceProvider: userProfile?.role === "service_provider",
    isClient: userProfile?.role === "client",
    checkServiceOwnership,
    refreshProfile,
  };

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
};