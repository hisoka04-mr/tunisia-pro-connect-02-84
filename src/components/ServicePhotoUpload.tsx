import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ServicePhotoUploadProps {
  onPhotoSelect: (photoUrl: string | null) => void;
  selectedPhoto: string | null;
  businessName?: string;
  serviceId?: string; // Add serviceId to save photos to database
}

const ServicePhotoUpload = ({ 
  onPhotoSelect, 
  selectedPhoto, 
  businessName = "Service",
  serviceId
}: ServicePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB.');
      }

      if (!user) {
        throw new Error('No user found');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/service-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Pass the URL to parent component (for form state)
      onPhotoSelect(urlData.publicUrl);

      // If serviceId is provided, save to database
      if (serviceId) {
        try {
          // Mark other photos as non-primary for this service
          await supabase
            .from('service_images')
            .update({ is_primary: false })
            .eq('service_id', serviceId);

          // Save the new photo as primary
          const { error: saveError } = await supabase
            .from('service_images')
            .insert({
              service_id: serviceId,
              image_url: urlData.publicUrl,
              is_primary: true,
              alt_text: `${businessName} service photo`
            });

          if (saveError) {
            console.warn('Failed to save photo to database:', saveError);
          }
        } catch (dbError) {
          console.warn('Database save failed:', dbError);
        }
      }

      toast({
        title: "Photo uploaded",
        description: "Your service photo has been uploaded successfully.",
      });

    } catch (error: any) {
      toast({
        title: "Error uploading photo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    onPhotoSelect(null);
  };

  const initials = businessName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={selectedPhoto || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          
          {selectedPhoto && (
            <button
              onClick={removePhoto}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          <div className="absolute -bottom-1 -right-1">
            <label htmlFor="service-photo-upload" className="cursor-pointer">
              <div className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-1 shadow-lg transition-colors">
                <Camera className="h-3 w-3" />
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="service-photo-upload">
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            Add a photo to showcase your service
          </p>
        </div>
      </div>

      <Input
        id="service-photo-upload"
        type="file"
        accept="image/*"
        onChange={uploadPhoto}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
};

export default ServicePhotoUpload;