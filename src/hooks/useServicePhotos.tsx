import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useServicePhotos = () => {
  const { toast } = useToast();

  const saveServicePhoto = async (serviceId: string, photoUrl: string) => {
    try {
      // Mark other photos as non-primary for this service
      await supabase
        .from("service_images")
        .update({ is_primary: false })
        .eq("service_id", serviceId);

      // Insert new photo as primary
      const { error } = await supabase
        .from("service_images")
        .insert({
          service_id: serviceId,
          image_url: photoUrl,
          is_primary: true,
          alt_text: "Service photo"
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error("Error saving service photo:", error);
      toast({
        title: "Error",
        description: "Failed to save service photo",
        variant: "destructive",
      });
      return false;
    }
  };

  const getServicePhotos = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from("service_images")
        .select("*")
        .eq("service_id", serviceId)
        .order("is_primary", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching service photos:", error);
      return [];
    }
  };

  const getPrimaryServicePhoto = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from("service_images")
        .select("image_url")
        .eq("service_id", serviceId)
        .eq("is_primary", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching photo:", error);
        return null;
      }

      return data?.image_url || null;
    } catch (error: any) {
      console.error("Error fetching primary service photo:", error);
      return null;
    }
  };

  return {
    saveServicePhoto,
    getServicePhotos,
    getPrimaryServicePhoto
  };
};