import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Eye, Database } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceProvider {
  id: string;
  certificate_url: string;
  is_approved: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  job_categories: {
    name: string;
  } | null;
}

const AdminDashboard = () => {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceProviders();
  }, []);

  const fetchServiceProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          id,
          certificate_url,
          is_approved,
          created_at,
          profiles (
            first_name,
            last_name,
            phone
          ),
          job_categories (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Filter out any records with relation errors and type assert the valid ones
      const validProviders = (data || []).filter(
        (provider: any) => 
          provider.profiles && 
          typeof provider.profiles === 'object' && 
          !provider.profiles.error &&
          provider.job_categories &&
          typeof provider.job_categories === 'object' &&
          !provider.job_categories.error
      ) as unknown as ServiceProvider[];
      setServiceProviders(validProviders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load service providers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificateAction = async (providerId: string, action: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          is_approved: action === "approved",
        })
        .eq("id", providerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Certificate ${action} successfully`,
      });

      setSelectedProvider(null);
      setAdminNotes("");
      fetchServiceProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update certificate status",
        variant: "destructive",
      });
    }
  };

  const openCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, "_blank");
  };

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading service providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage service provider certificate verifications
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/database-management">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Database Management</h3>
                    <p className="text-sm text-muted-foreground">Modern table interface</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{serviceProviders.filter(p => p.is_approved).length}</h3>
                  <p className="text-sm text-muted-foreground">Approved Providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{serviceProviders.filter(p => !p.is_approved).length}</h3>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {serviceProviders.map((provider) => (
            <Card key={provider.id} className="border border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {provider.profiles?.first_name} {provider.profiles?.last_name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {provider.job_categories?.name} Service Provider
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      Phone: {provider.profiles?.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(provider.is_approved)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(provider.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {provider.certificate_url && (
                    <Button
                      variant="outline"
                      onClick={() => openCertificate(provider.certificate_url)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Certificate
                    </Button>
                  )}

                  {!provider.is_approved && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setAdminNotes("");
                        }}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  )}

                  {provider.is_approved && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Approved</span>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}

          {serviceProviders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No service providers found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Review Modal */}
        {selectedProvider && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Review Certificate</CardTitle>
                <CardDescription>
                  {selectedProvider.profiles?.first_name} {selectedProvider.profiles?.last_name} - {selectedProvider.job_categories?.name} Provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about the verification..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleCertificateAction(selectedProvider.id, "approved")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleCertificateAction(selectedProvider.id, "rejected")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProvider(null);
                    setAdminNotes("");
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;