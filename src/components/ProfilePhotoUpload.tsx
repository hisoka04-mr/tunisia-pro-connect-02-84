import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  userFirstName?: string;
  userLastName?: string;
  size?: "sm" | "md" | "lg";
}

const ProfilePhotoUpload = ({ 
  currentPhotoUrl, 
  userFirstName, 
  userLastName, 
  size = "md" 
}: ProfilePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const { user } = useAuth();
  const { refreshProfile } = useUserRole();
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24"
  };

  // Update local photo URL when currentPhotoUrl prop changes
  useEffect(() => {
    setLocalPhotoUrl(currentPhotoUrl || null);
  }, [currentPhotoUrl]);

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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB.');
      }

      if (!user) {
        throw new Error('No user found');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Add cache-busting parameter to force browser reload
      const timestamp = Date.now();
      const imageUrlWithCacheBust = `${urlData.publicUrl}?t=${timestamp}`;

      // Save to profile_pictures table - the trigger will handle syncing to profiles and service_providers
      const { error: pictureError } = await supabase
        .from('profile_pictures')
        .insert({
          user_id: user.id,
          image_url: imageUrlWithCacheBust,
          is_active: true,
          file_size: file.size,
          mime_type: file.type,
          alt_text: `${userFirstName || ''} ${userLastName || ''}`.trim() || 'Profile photo'
        });

      if (pictureError) {
        throw pictureError;
      }

      // Update local state immediately to show new photo with cache-busting
      setLocalPhotoUrl(imageUrlWithCacheBust);

      // Refresh the user profile to get the updated photo
      await refreshProfile();

      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully updated.",
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

  const initials = `${userFirstName?.[0] || ''}${userLastName?.[0] || ''}`;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage 
            src={localPhotoUrl || (user?.user_metadata as any)?.profile_photo_url || (user?.user_metadata as any)?.avatar_url || undefined}
            alt={`${userFirstName || ''} ${userLastName || ''}`.trim() || 'User avatar'}
            loading="lazy"
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
        {size !== "sm" && (
          <div className="absolute -bottom-1 -right-1">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <div className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-1 shadow-lg transition-colors">
                <Camera className="h-3 w-3" />
              </div>
            </label>
          </div>
        )}
      </div>

      {size !== "sm" && (
        <div className="flex flex-col space-y-2">
          <label htmlFor="photo-upload">
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </span>
            </Button>
          </label>
        </div>
      )}

      <Input
        id="photo-upload"
        type="file"
        accept="image/*"
        onChange={uploadPhoto}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoUpload;