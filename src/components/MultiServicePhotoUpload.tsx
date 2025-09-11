import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LazyImage from "@/components/LazyImage";

interface MultiServicePhotoUploadProps {
  onPhotosChange: (photos: string[]) => void;
  selectedPhotos: string[];
  businessName?: string;
  serviceId?: string;
  maxPhotos?: number;
}

const MultiServicePhotoUpload = ({ 
  onPhotosChange, 
  selectedPhotos, 
  businessName = "Service",
  serviceId,
  maxPhotos = 3
}: MultiServicePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      if (selectedPhotos.length >= maxPhotos) {
        throw new Error(`You can only upload up to ${maxPhotos} photos.`);
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
      const fileName = `${user.id}/service-${serviceId || Date.now()}-${Date.now()}.${fileExt}`;

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

      // Add to selected photos
      const newPhotos = [...selectedPhotos, urlData.publicUrl];
      onPhotosChange(newPhotos);

      // If serviceId is provided, save to database
      if (serviceId) {
        try {
          const { error: saveError } = await supabase
            .from('service_images')
            .insert({
              service_id: serviceId,
              image_url: urlData.publicUrl,
              is_primary: selectedPhotos.length === 0, // First photo is primary
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
      // Reset the input
      event.target.value = '';
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      // Remove from local state
      const newPhotos = selectedPhotos.filter(url => url !== photoUrl);
      onPhotosChange(newPhotos);

      // If serviceId is provided, remove from database
      if (serviceId) {
        const { error } = await supabase
          .from('service_images')
          .delete()
          .eq('service_id', serviceId)
          .eq('image_url', photoUrl);

        if (error) {
          console.warn('Failed to remove photo from database:', error);
        }
      }

      toast({
        title: "Photo removed",
        description: "Photo has been removed from your service.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing photo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {selectedPhotos.length < maxPhotos && (
        <div className="flex items-center justify-center">
          <label htmlFor="multi-service-photo-upload">
            <Button variant="outline" disabled={uploading} asChild>
              <span className="cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : `Upload Photo (${selectedPhotos.length}/${maxPhotos})`}
              </span>
            </Button>
          </label>
          <Input
            id="multi-service-photo-upload"
            type="file"
            accept="image/*"
            onChange={uploadPhoto}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}

      {/* Photos Grid */}
      {selectedPhotos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedPhotos.map((photoUrl, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <LazyImage
                    src={photoUrl}
                    alt={`Service photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      Primary
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(photoUrl)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:bg-destructive/90 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              No photos uploaded yet.<br />
              Add up to {maxPhotos} photos to showcase your service!
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Upload up to {maxPhotos} photos to showcase your service. First photo will be used as the primary image.
      </p>
    </div>
  );
};

export default MultiServicePhotoUpload;