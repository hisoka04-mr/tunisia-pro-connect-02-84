import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";
import { FileUpload } from "@/components/auth/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { User, Mail, Phone, Calendar, Briefcase, Star, CheckCircle } from "lucide-react";

interface JobCategory {
  id: string;
  name: string;
}

export const ServiceProviderProfileEdit = () => {
  const { user } = useAuth();
  const { userProfile, refreshProfile } = useUserRole();
  const { toast } = useToast();
  const { uploadCertificate } = useFileUpload();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    business_name: "",
    business_description: "",
    experience_years: "",
    job_category_id: "",
  });
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [newCv, setNewCv] = useState<File | null>(null);
  const [serviceProvider, setServiceProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchJobCategories();
    fetchServiceProviderData();
  }, []);

  useEffect(() => {
    if (userProfile && serviceProvider) {
      setFormData({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        phone: userProfile.phone || "",
        business_name: serviceProvider.business_name || "",
        business_description: serviceProvider.business_description || "",
        experience_years: serviceProvider.experience_years?.toString() || "",
        job_category_id: serviceProvider.job_category_id || "",
      });
    }
  }, [userProfile, serviceProvider]);

  const fetchJobCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      setJobCategories(data || []);
    } catch (error) {
      console.error("Error fetching job categories:", error);
    }
  };

  const fetchServiceProviderData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      setServiceProvider(data);
    } catch (error) {
      console.error("Error fetching service provider data:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Handle CV upload if new file provided
      let certificateUrl = serviceProvider?.certificate_url || "";
      if (newCv) {
        try {
          certificateUrl = await uploadCertificate(user.id, newCv);
        } catch (uploadError) {
          console.warn("CV upload failed:", uploadError);
        }
      }

      // Update or create service provider profile
      const serviceProviderData = {
        user_id: user.id,
        business_name: formData.business_name,
        business_description: formData.business_description,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        job_category_id: formData.job_category_id || null,
        certificate_url: certificateUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (serviceProvider) {
        const { error: providerError } = await supabase
          .from("service_providers")
          .update(serviceProviderData)
          .eq("user_id", user.id);
        
        if (providerError) throw providerError;
      } else {
        const { error: providerError } = await supabase
          .from("service_providers")
          .insert({
            ...serviceProviderData,
            is_approved: true,
          });
        
        if (providerError) throw providerError;
      }

      await refreshProfile();
      await fetchServiceProviderData();

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center space-y-4">
              <ProfilePhotoUpload 
                currentPhotoUrl={userProfile?.profile_photo_url}
                userFirstName={userProfile?.first_name}
                userLastName={userProfile?.last_name}
                size="lg"
              />
              <p className="text-sm text-gray-600 text-center">
                Click on your photo to change it
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                placeholder="Enter your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_category_id">Service Category</Label>
              <Select 
                value={formData.job_category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, job_category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service category" />
                </SelectTrigger>
                <SelectContent>
                  {jobCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                name="experience_years"
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={handleInputChange}
                placeholder="Enter years of experience"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                name="business_description"
                value={formData.business_description}
                onChange={handleInputChange}
                placeholder="Describe your business and services..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <FileUpload
                id="cv-update"
                label="Update CV (Curriculum Vitae)"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onFileChange={setNewCv}
                description="Upload a new CV/Resume (PDF, JPG, PNG, DOC, DOCX)"
              />
              {serviceProvider?.certificate_url && (
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Current CV available</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(serviceProvider.certificate_url, '_blank')}
                    className="ml-2"
                  >
                    View CV
                  </Button>
                </div>
              )}
            </div>

            <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Email:</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Member since:</span>
            <span className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Status:</span>
            <span className="font-medium text-green-600">
              {serviceProvider?.is_approved ? "Approved" : "Pending Approval"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">Rating:</span>
            <span className="font-medium">
              {serviceProvider?.rating ? `${serviceProvider.rating}/5` : "No ratings yet"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};