import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Monitor } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://svcklgpspnvjvdouqmvx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Y2tsZ3BzcG52anZkb3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTQyMTUsImV4cCI6MjA3MDgzMDIxNX0.9nvRrdRgy0FKSEU-FhJ8DdSHjyttQTHD5loYrtE3vRs";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  serviceType: "onsite" | "online";
  jobCategory: string;
}

export const ServiceProviderRegistration = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    serviceType: "onsite",
    jobCategory: "",
  });
  const [jobCategories, setJobCategories] = useState<Array<{id: string, name: string, service_type: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadJobCategories = async (serviceType: string) => {
    try {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, name, service_type")
        .eq("service_type", serviceType)
        .order("name");
      
      if (!error && data) {
        setJobCategories(data);
      }
    } catch (err) {
      console.error("Error loading job categories:", err);
    }
  };

  useEffect(() => {
    loadJobCategories(formData.serviceType);
  }, [formData.serviceType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceTypeChange = (serviceType: "onsite" | "online") => {
    setFormData(prev => ({ ...prev, serviceType, jobCategory: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Error",
        description: "You must agree to our terms and conditions",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.jobCategory) {
      toast({
        title: "Error",
        description: "Please select a job category",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: "service_provider",
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update account type in profiles
        const accountType = formData.serviceType === 'onsite' ? 'onsite_provider' : 'online_provider';
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ account_type: accountType })
          .eq("id", authData.user.id);

        if (profileError) {
          console.warn("Profile account type update failed:", profileError);
        }

        // Create service provider profile
        const { error: providerError } = await supabase
          .from("service_providers")
          .insert({
            user_id: authData.user.id,
            business_name: `${formData.firstName} ${formData.lastName}`,
            job_category_id: formData.jobCategory,
            is_approved: true,
          });

        if (providerError) {
          console.warn("Service provider profile creation failed:", providerError);
        }

        // Create service provider preferences
        const { error: preferencesError } = await supabase
          .from("service_provider_preferences")
          .insert({
            user_id: authData.user.id,
            preferred_service_type: formData.serviceType,
          });

        if (preferencesError) {
          console.warn("Service provider preferences creation failed:", preferencesError);
        }
      }

      toast({
        title: "Registration successful!",
        description: "Account created successfully. You can now post your services in the Services section.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create account";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Type Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Preferred Service Type</Label>
          <p className="text-sm text-muted-foreground">
            Choose your primary service delivery method. You can always offer both types later.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handleServiceTypeChange("onsite")}
            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
              formData.serviceType === "onsite"
                ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg shadow-primary/20"
                : "border-border/50 hover:border-primary/50 bg-background/50"
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                formData.serviceType === "onsite" 
                  ? "bg-gradient-to-br from-primary to-accent" 
                  : "bg-muted"
              }`}>
                <Wrench className={`h-6 w-6 ${
                  formData.serviceType === "onsite" ? "text-white" : "text-primary"
                }`} />
              </div>
              <h4 className="font-semibold text-foreground mb-2">On-site Service</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Services at client's location (plumber, electrician, cleaner, etc.)
              </p>
            </div>
          </div>

          <div
            onClick={() => handleServiceTypeChange("online")}
            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
              formData.serviceType === "online"
                ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg shadow-primary/20"
                : "border-border/50 hover:border-primary/50 bg-background/50"
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                formData.serviceType === "online" 
                  ? "bg-gradient-to-br from-primary to-accent" 
                  : "bg-muted"
              }`}>
                <Monitor className={`h-6 w-6 ${
                  formData.serviceType === "online" ? "text-white" : "text-primary"
                }`} />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Online Service</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Remote services (web development, design, tutoring, etc.)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Category Selection */}
      <div className="space-y-3">
        <Label htmlFor="jobCategory" className="text-sm font-medium text-foreground">Job Category</Label>
        <Select
          value={formData.jobCategory}
          onValueChange={(value) => setFormData(prev => ({ ...prev, jobCategory: value }))}
          required
        >
          <SelectTrigger className="h-12 bg-background border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select your job category" />
          </SelectTrigger>
          <SelectContent>
            {jobCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
          <span className="font-medium">Note:</span> Categories are filtered based on your selected service type ({formData.serviceType})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleInputChange}
            className="h-12 bg-background border-border/50 focus:border-primary transition-colors"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleInputChange}
            className="h-12 bg-background border-border/50 focus:border-primary transition-colors"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange}
          className="h-12 bg-background border-border/50 focus:border-primary transition-colors"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleInputChange}
          className="h-12 bg-background border-border/50 focus:border-primary transition-colors"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleInputChange}
          className="h-12 bg-background border-border/50 focus:border-primary transition-colors"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="h-12 bg-background border-border/50 focus:border-primary transition-colors"
          required
        />
      </div>

      <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border/50">
        <Checkbox
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
          }
          className="mt-0.5"
          required
        />
        <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed text-muted-foreground">
          I agree to the{" "}
          <a href="/terms" className="text-primary hover:underline font-medium" target="_blank">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline font-medium" target="_blank">
            Privacy Policy
          </a>
        </Label>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-medium text-base shadow-lg transition-all duration-200 hover:shadow-xl" 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Creating account...</span>
          </div>
        ) : (
          "Create Provider Account"
        )}
      </Button>
    </form>
  );
};