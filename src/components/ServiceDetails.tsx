import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, MapPin, Clock, DollarSign, Edit, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useServicePhotos } from "@/hooks/useServicePhotos";
import ServicePhotoUpload from "@/components/ServicePhotoUpload";
import LazyImage from "@/components/LazyImage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ServiceDetailsProps {
  service: any;
  onBack: () => void;
  onBookService?: () => void;
  isOwner?: boolean;
}

export const ServiceDetails = ({ service, onBack, onBookService, isOwner = false }: ServiceDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getServicePhotos } = useServicePhotos();
  const [servicePhotos, setServicePhotos] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service?.id) {
      fetchServicePhotos();
    }
  }, [service?.id]);

  const fetchServicePhotos = async () => {
    try {
      const photos = await getServicePhotos(service.id);
      setServicePhotos(photos || []);
      setSelectedPhotos(photos?.map(p => p.image_url) || []);
    } catch (error) {
      console.error("Error fetching service photos:", error);
    }
  };

  const handlePhotoUpload = async (photoUrl: string) => {
    if (selectedPhotos.length >= 3) {
      toast({
        title: "Photo limit reached",
        description: "You can upload maximum 3 photos per service",
        variant: "destructive",
      });
      return;
    }

    setSelectedPhotos(prev => [...prev, photoUrl]);
    await fetchServicePhotos(); // Refresh photos from database
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from("service_images")
        .delete()
        .eq("service_id", service.id)
        .eq("image_url", photoUrl);

      if (error) throw error;

      // Update local state
      setSelectedPhotos(prev => prev.filter(url => url !== photoUrl));
      await fetchServicePhotos();

      toast({
        title: "Photo removed",
        description: "Photo has been removed from your service",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove photo",
        variant: "destructive",
      });
    }
  };

  const handleSavePhotos = async () => {
    setLoading(true);
    try {
      // The photos are already saved to database through ServicePhotoUpload
      // Just refresh the display
      await fetchServicePhotos();
      setIsEditing(false);
      
      toast({
        title: "Photos updated",
        description: "Your service photos have been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update photos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = (booking: { date: Date; time: string; providerId: string }) => {
    navigate('/booking-form', {
      state: {
        providerId: booking.providerId,
        serviceId: service.id,
        selectedDate: booking.date,
        selectedTime: booking.time,
        businessName: service.business_name,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{service.business_name}</h1>
          <p className="text-muted-foreground">{service.location}</p>
        </div>
      </div>

      {/* Service Photos Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Service Photos ({servicePhotos.length}/3)
          </CardTitle>
          {isOwner && (
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Photos
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSavePhotos} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Photo Upload Section (only for owners in edit mode) */}
          {isOwner && isEditing && selectedPhotos.length < 3 && (
            <div className="mb-6">
              <ServicePhotoUpload
                onPhotoSelect={handlePhotoUpload}
                selectedPhoto={null}
                businessName={service.business_name}
                serviceId={service.id}
              />
            </div>
          )}

          {/* Photos Grid */}
          {servicePhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicePhotos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div className="relative overflow-hidden rounded-lg aspect-square">
                    <LazyImage
                      src={photo.image_url}
                      alt={photo.alt_text || `Service photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.is_primary && (
                      <Badge className="absolute top-2 left-2 bg-primary">
                        Primary
                      </Badge>
                    )}
                    {isOwner && isEditing && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(photo.image_url)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isOwner ? "No photos uploaded yet. Add some photos to showcase your service!" : "No photos available for this service"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Information */}
      <Card>
        <CardHeader>
          <CardTitle>Service Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Location:</span>
              <span>{service.location}</span>
            </div>
            
            {service.hourly_rate && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Rate:</span>
                <span className="font-bold text-primary">{service.hourly_rate} TND/hour</span>
              </div>
            )}
            
            {service.experience_years && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Experience:</span>
                <span>{service.experience_years} years</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant={service.is_active ? "default" : "secondary"}>
                {service.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground leading-relaxed">{service.description}</p>
          </div>

          {/* Availability Notes */}
          {service.availability_notes && (
            <div>
              <h4 className="font-medium mb-2">Availability</h4>
              <p className="text-muted-foreground">{service.availability_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking section handled by page-level component */}
    </div>
  );
};

export default ServiceDetails;