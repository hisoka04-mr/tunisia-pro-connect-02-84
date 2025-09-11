import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Edit, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PostServiceForm } from "./PostServiceForm";

export const MyServices = () => {
  const { user } = useAuth();
  const { fetchUserServices, deleteService, toggleServiceStatus } = useServices();
  const [userServices, setUserServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserServices = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        await fetchUserServices();
      } catch (error) {
        console.error("Error loading user services:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserServices();
  }, [user, fetchUserServices]);

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await deleteService(serviceId);
      setUserServices(prev => prev.filter(s => s.id !== serviceId));
      toast({
        title: "Service deleted",
        description: "Your service has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      await toggleServiceStatus(serviceId, !currentStatus);
      setUserServices(prev => 
        prev.map(s => s.id === serviceId ? { ...s, is_active: !currentStatus } : s)
      );
      toast({
        title: currentStatus ? "Service deactivated" : "Service activated",
        description: `Your service is now ${!currentStatus ? 'active' : 'inactive'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your services...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Services</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Post New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post Your Service</DialogTitle>
            </DialogHeader>
            <PostServiceForm onSuccess={() => {
              setDialogOpen(false);
              // Reload services
              fetchUserServices();
            }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {userServices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't posted any services yet.</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Service
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            {userServices.map((service) => (
              <div key={service.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{service.service_title || service.business_name}</h3>
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {(service as any).service_type && (
                        <Badge variant="outline">
                          {(service as any).service_type === 'onsite' ? 'On-site' : 'Online'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📍 {service.location}</span>
                      {service.hourly_rate && <span>💰 {service.hourly_rate} TND/hr</span>}
                      <span>📅 {new Date(service.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(service.id, service.is_active)}
                    >
                      {service.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};