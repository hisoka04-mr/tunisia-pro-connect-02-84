import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, User, Image, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";

interface ServiceWithPhoto {
  id: string;
  business_name: string;
  hasPhoto: boolean;
}

export const PhotoStatusCard = () => {
  const { user } = useAuth();
  const { userProfile } = useUserRole();
  const [userServices, setUserServices] = useState<ServiceWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserServices();
    }
  }, [user]);

  const fetchUserServices = async () => {
    if (!user) return;

    try {
      // Get user's services
      const { data: services, error } = await supabase
        .from('services')
        .select('id, business_name')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      if (services && services.length > 0) {
        // Check which services have photos
        const servicesWithPhotoStatus = await Promise.all(
          services.map(async (service) => {
            const { data: photos } = await supabase
              .from('service_images')
              .select('id')
              .eq('service_id', service.id)
              .eq('is_primary', true)
              .maybeSingle();

            return {
              id: service.id,
              business_name: service.business_name,
              hasPhoto: !!photos
            };
          })
        );

        setUserServices(servicesWithPhotoStatus);
      }
    } catch (error) {
      console.error('Error fetching user services:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasProfilePhoto = userProfile?.profile_photo_url;
  const totalServices = userServices.length;
  const servicesWithPhotos = userServices.filter(s => s.hasPhoto).length;

  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photo Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Photo Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Profile Photo</p>
              <p className="text-sm text-muted-foreground">Shows as your avatar in service listings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasProfilePhoto ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Added
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Missing
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Profile Photo Upload */}
        {!hasProfilePhoto && (
          <div className="p-3 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50">
            <p className="text-sm text-orange-800 mb-3">
              Add a profile photo to appear more professional to clients
            </p>
            <ProfilePhotoUpload 
              currentPhotoUrl={userProfile?.profile_photo_url}
              userFirstName={userProfile?.first_name}
              userLastName={userProfile?.last_name}
              size="sm"
            />
          </div>
        )}

        {/* Service Photos Status */}
        {loading ? (
          <div className="p-3 border rounded-lg">
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Image className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Service Photos</p>
                <p className="text-sm text-muted-foreground">
                  {totalServices === 0 
                    ? "No services posted yet"
                    : `${servicesWithPhotos} of ${totalServices} services have photos`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalServices === 0 ? (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  No Services
                </Badge>
              ) : servicesWithPhotos === totalServices ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Complete
                  </Badge>
                </>
              ) : servicesWithPhotos > 0 ? (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Partial
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Missing
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        {/* Service Photos Details */}
        {userServices.length > 0 && (
          <div className="space-y-2">
            {userServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-2 text-sm border rounded">
                <span className="font-medium">{service.business_name}</span>
                {service.hasPhoto ? (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Photo Added
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    No Photo
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📸 Photo Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Add a profile photo by clicking your avatar in the top navigation</li>
            <li>• Service photos can be added when creating new services</li>
            <li>• Clear, professional photos increase customer trust</li>
            <li>• Photos should be under 5MB and in common formats (JPG, PNG, WebP)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoStatusCard;