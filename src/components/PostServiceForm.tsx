import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { removeMedicalCategories } from "@/utils/removeMedicalCategories";
import { ServiceCreationData, createService, ensureServiceProvider } from "@/utils/serviceOperations";
import { SERVICE_CATEGORIES, getOnSiteCategories, getOnlineCategories } from "@/utils/serviceCategories";
import { Briefcase, MapPin, Clock, DollarSign, Star, Sparkles, Camera, Monitor, Wrench, Calendar, FileText, Award } from "lucide-react";
import MultiServicePhotoUpload from "@/components/MultiServicePhotoUpload";
import CategorizedSkillsSelector from "@/components/CategorizedSkillsSelector";

interface JobCategory {
  id: string;
  name: string;
  description: string;
  service_type?: 'onsite' | 'online' | string;
}

interface PostServiceFormProps {
  onSuccess?: () => void;
}

type ServiceType = 'onsite' | 'online';

interface FormData {
  // Common fields
  service_type: ServiceType;
  service_title: string;
  description: string;
  job_category_id: string;
  price_type: 'hourly' | 'fixed' | 'package';
  hourly_rate: string;
  fixed_price: string;
  experience_years: string;
  subscription_plan: string;
  
  // Availability
  availability_days: string[];
  availability_start: string;
  availability_end: string;
  
  // On-site specific fields
  location: string;
  area_covered: string[];
  
  // Online specific fields
  delivery_time: string;
  skills_tools: string[];
  portfolio_files: string[];
}

const TUNISIAN_LOCATIONS = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte", 
  "Béja", "Jendouba", "Kef", "Siliana", "Kairouan", "Kasserine", "Sidi Bouzid", 
  "Sousse", "Monastir", "Mahdia", "Sfax", "Gafsa", "Tozeur", "Kebili", "Gabès", 
  "Medenine", "Tataouine"
];

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const DELIVERY_TIME_OPTIONS = [
  "Same day", "1-2 days", "3-5 days", "1 week", "2 weeks", "1 month", "Custom timeline"
];

export const PostServiceForm = ({ onSuccess }: PostServiceFormProps) => {
  const navigate = useNavigate();
  const { permissions, userProfile } = usePermissions();
  const [formData, setFormData] = useState<FormData>({
    service_type: 'onsite',
    service_title: "",
    description: "",
    job_category_id: "",
    price_type: 'hourly',
    hourly_rate: "",
    fixed_price: "",
    experience_years: "",
    subscription_plan: "basic",
    availability_days: [],
    availability_start: "",
    availability_end: "",
    location: "",
    area_covered: [],
    delivery_time: "",
    skills_tools: [],
    portfolio_files: []
  });

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceProvider, setServiceProvider] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newSkill, setNewSkill] = useState("");
  const [newAreaCovered, setNewAreaCovered] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchJobCategories();
    checkServiceProvider();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (serviceProvider !== null) {
      setInitialLoading(false);
    }
  }, [serviceProvider]);

  const fetchJobCategories = async () => {
    try {
      await removeMedicalCategories();
      
      const { data, error } = await supabase
        .from("job_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      
      if (!data || data.length === 0) {
        await seedCategories();
        const { data: newData, error: newError } = await supabase
          .from("job_categories")
          .select("*")
          .order("name");
        
        if (newError) throw newError;
        setJobCategories(newData || []);
      } else {
        setJobCategories(data);
      }
    } catch (error) {
      console.error("Error fetching job categories:", error);
      toast({
        title: "Error loading categories",
        description: "Failed to load service categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  const seedCategories = async () => {
    // Use predefined categories from serviceCategories.ts
    const categories = SERVICE_CATEGORIES.map(cat => ({
      name: cat.name,
      description: cat.description || `${cat.name} services`
    }));

    try {
      const { error } = await supabase
        .from("job_categories")
        .insert(categories);

      if (error) throw error;
    } catch (error) {
      console.error("Error seeding categories:", error);
    }
  };

  const checkServiceProvider = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setServiceProvider(null);
        return;
      }

      setServiceProvider({
        user_id: user.id,
        id: `temp_${user.id}`,
        is_approved: true,
        rating: 0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        business_name: null,
        bio: null,
        experience_years: 0,
        hourly_rate: null,
        location: null,
        subscription_plan: 'basic',
        certificate_url: null
      });

    } catch (error) {
      console.error("Error in checkServiceProvider:", error);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setServiceProvider({
          user_id: user.id,
          id: `temp_${user.id}`,
          is_approved: true,
          rating: 0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          business_name: null,
          bio: null,
          experience_years: 0,
          hourly_rate: null,
          location: null,
          subscription_plan: 'basic',
          certificate_url: null
        });
      } else {
        setServiceProvider(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceTypeChange = (serviceType: ServiceType) => {
    // Get current category to check if it's compatible with new service type
    const currentCategory = jobCategories.find(cat => cat.id === formData.job_category_id);
    const currentCategoryServiceType = currentCategory ? 
      SERVICE_CATEGORIES.find(sc => sc.name === currentCategory.name)?.type : null;
    
    setFormData(prev => ({ 
      ...prev, 
      service_type: serviceType,
      // Reset category if it's not compatible with the new service type
      job_category_id: currentCategoryServiceType === serviceType ? prev.job_category_id : "",
      // Reset type-specific fields when changing service type
      location: serviceType === 'onsite' ? prev.location : "",
      area_covered: serviceType === 'onsite' ? prev.area_covered : [],
      availability_days: serviceType === 'onsite' ? prev.availability_days : [],
      availability_start: serviceType === 'onsite' ? prev.availability_start : "",
      availability_end: serviceType === 'onsite' ? prev.availability_end : "",
      delivery_time: serviceType === 'online' ? prev.delivery_time : "",
      skills_tools: serviceType === 'online' ? prev.skills_tools : [],
      portfolio_files: serviceType === 'online' ? prev.portfolio_files : []
    }));
  };

  // Filter categories based on selected service type
  const getFilteredCategories = () => {
    return jobCategories.filter(category => {
      // Use service_type from database if available, fallback to SERVICE_CATEGORIES mapping
      if ((category as any).service_type) {
        return (category as any).service_type === formData.service_type;
      }
      // Fallback to SERVICE_CATEGORIES mapping for existing data
      const serviceCategory = SERVICE_CATEGORIES.find(sc => sc.name === category.name);
      return serviceCategory?.type === formData.service_type;
    });
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability_days: prev.availability_days.includes(day)
        ? prev.availability_days.filter(d => d !== day)
        : [...prev.availability_days, day]
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills_tools.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills_tools: [...prev.skills_tools, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills_tools: prev.skills_tools.filter(s => s !== skill)
    }));
  };

  const addAreaCovered = () => {
    if (newAreaCovered.trim() && !formData.area_covered.includes(newAreaCovered.trim())) {
      setFormData(prev => ({
        ...prev,
        area_covered: [...prev.area_covered, newAreaCovered.trim()]
      }));
      setNewAreaCovered("");
    }
  };

  const removeAreaCovered = (area: string) => {
    setFormData(prev => ({
      ...prev,
      area_covered: prev.area_covered.filter(a => a !== area)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("=== SERVICE POSTING DEBUG START ===");
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("Auth check result:", { user: user?.id, error: authError });
      
      if (!user) {
        console.log("No user found, authentication required");
        toast({
          title: "Error",
          description: "You must be logged in to post a service",
          variant: "destructive",
        });
        return;
      }
      
      console.log("User authenticated:", user.id);

      if (!serviceProvider) {
        console.log("No service provider found");
        toast({
          title: "Error", 
          description: "You must be a registered service provider to post services",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Service provider found:", serviceProvider.id);

      // Validate required fields based on service type
      const commonFieldsMissing = !formData.job_category_id || !formData.service_title || !formData.description;
      
      if (commonFieldsMissing) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (service title, category, and description)",
          variant: "destructive",
        });
        return;
      }

      // Service type specific validation
      if (formData.service_type === 'onsite' && !formData.location) {
        toast({
          title: "Error", 
          description: "Please select a location for your on-site service",
          variant: "destructive",
        });
        return;
      }

      // Prepare service creation data - only include relevant fields for each service type
      const serviceCreationData: ServiceCreationData = {
        service_type: formData.service_type,
        service_title: formData.service_title,
        description: formData.description,
        location: formData.service_type === 'onsite' ? formData.location : 'Online',
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
        hourly_rate: formData.price_type === 'hourly' && formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        fixed_price: formData.price_type !== 'hourly' && formData.fixed_price ? parseFloat(formData.fixed_price) : null,
        price_type: formData.price_type,
        subscription_plan: formData.subscription_plan,
        job_category_id: formData.job_category_id,
        
        // On-site service specific fields
        ...(formData.service_type === 'onsite' && {
          availability: formData.availability_days.length > 0 ? {
            days: formData.availability_days,
            hours: { start: formData.availability_start, end: formData.availability_end }
          } : null,
          area_covered: formData.area_covered.length > 0 ? formData.area_covered : null,
        }),
        
        // Online service specific fields  
        ...(formData.service_type === 'online' && {
          delivery_time: formData.delivery_time || null,
          skills_tools: formData.skills_tools.length > 0 ? formData.skills_tools : null,
          portfolio_files: formData.portfolio_files.length > 0 ? formData.portfolio_files : null,
        })
      };

      console.log("Preparing service creation data:", serviceCreationData);

      const createdService = await createService(serviceCreationData, user.id);
      
      console.log("Service created successfully:", createdService);
      console.log("=== SERVICE POSTING DEBUG END ===");
      
      toast({
        title: "Service posted successfully!",
        description: `Your ${formData.service_type} service is now visible to potential clients.`,
      });

      // Reset form
      setFormData({
        service_type: 'onsite',
        service_title: "",
        description: "",
        job_category_id: "",
        price_type: 'hourly',
        hourly_rate: "",
        fixed_price: "",
        experience_years: "",
        subscription_plan: "basic",
        availability_days: [],
        availability_start: "",
        availability_end: "",
        location: "",
        area_covered: [],
        delivery_time: "",
        skills_tools: [],
        portfolio_files: []
      });
      setSelectedPhotos([]);
      
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate('/services');
        }, 1500);
      }

    } catch (error: any) {
      console.error("=== SERVICE POSTING ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("================================");
      
      toast({
        title: "Error",
        description: error.message || "Failed to post service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Permission checks and loading states
  if (!permissions.canCreateServices) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Post Your Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Access Denied</p>
            <p className="text-muted-foreground mb-4">
              Only service providers can post services. Please register as a service provider first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!serviceProvider && initialLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Post Your Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!serviceProvider) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Post Your Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Unable to load your service provider profile. Please try again or contact support if the problem persists.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-2 rounded-full mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Professional Service Listing</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Service</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose between on-site services (physical location) or online services (remote delivery)
        </p>
      </div>

      <Card className="border-0 shadow-2xl bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Service Details
          </CardTitle>
          {userProfile?.role === "service_provider" && !userProfile?.is_approved && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Star className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Your service provider account is pending approval. You can post services, but they may require admin review before becoming visible to clients.
                </p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Type Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Service Type</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => handleServiceTypeChange('onsite')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    formData.service_type === 'onsite'
                      ? 'border-primary bg-gradient-to-br from-primary/5 to-accent/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <Wrench className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-semibold text-foreground mb-2">On-site Service</h4>
                    <p className="text-sm text-muted-foreground">
                      Services performed at client's location (plumber, electrician, cleaner, etc.)
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => handleServiceTypeChange('online')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    formData.service_type === 'online'
                      ? 'border-primary bg-gradient-to-br from-primary/5 to-accent/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <Monitor className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-semibold text-foreground mb-2">Online Service</h4>
                    <p className="text-sm text-muted-foreground">
                      Services delivered remotely (web development, design, tutoring, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Service Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-secondary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service_title" className="text-sm font-medium text-foreground">
                    Service Title *
                  </Label>
                  <Input
                    id="service_title"
                    name="service_title"
                    placeholder={`${formData.service_type === 'onsite' ? 'e.g., "Fix kitchen sink"' : 'e.g., "Build a portfolio website"'}`}
                    value={formData.service_title}
                    onChange={handleInputChange}
                    required
                    className="h-12 border-2 border-muted focus:border-primary transition-colors"
                  />
                </div>


                <div>
                  <Label htmlFor="job_category_id" className="text-sm font-medium text-foreground">
                    Service Category *
                  </Label>
                  <Select 
                    value={formData.job_category_id} 
                    onValueChange={(value) => handleSelectChange("job_category_id", value)}
                  >
                    <SelectTrigger className="h-12 border-2 border-muted focus:border-primary">
                      <SelectValue placeholder={`Select ${formData.service_type === 'onsite' ? 'on-site' : 'online'} service category`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredCategories().map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">
                    Service Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your service, expertise, and what makes you unique..."
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="border-2 border-muted focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Pricing</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground">Price Type</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { value: "hourly", label: "Hourly Rate" },
                      { value: "fixed", label: "Fixed Price" },
                      { value: "package", label: "Package Deal" }
                    ].map((type) => (
                      <div
                        key={type.value}
                        onClick={() => handleSelectChange("price_type", type.value)}
                        className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                          formData.price_type === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.price_type === 'hourly' ? (
                    <div>
                      <Label htmlFor="hourly_rate" className="text-sm font-medium text-foreground">
                        Hourly Rate (TND)
                      </Label>
                      <Input
                        id="hourly_rate"
                        name="hourly_rate"
                        type="number"
                        placeholder="Enter rate per hour"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="h-12 border-2 border-muted focus:border-primary transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="fixed_price" className="text-sm font-medium text-foreground">
                        {formData.price_type === 'package' ? 'Package Price (TND)' : 'Fixed Price (TND)'}
                      </Label>
                      <Input
                        id="fixed_price"
                        name="fixed_price"
                        type="number"
                        placeholder={`Enter ${formData.price_type} price`}
                        value={formData.fixed_price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="h-12 border-2 border-muted focus:border-primary transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="experience_years" className="text-sm font-medium text-foreground">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience_years"
                      name="experience_years"
                      type="number"
                      placeholder="Years"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      min="0"
                      className="h-12 border-2 border-muted focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Section - Only for On-site Services */}
            {formData.service_type === 'onsite' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Availability</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Available Days
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={formData.availability_days.includes(day)}
                            onCheckedChange={() => handleDayToggle(day)}
                          />
                          <Label htmlFor={day} className="text-sm cursor-pointer">
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="availability_start" className="text-sm font-medium text-foreground">
                        Start Time
                      </Label>
                      <Input
                        id="availability_start"
                        name="availability_start"
                        type="time"
                        value={formData.availability_start}
                        onChange={handleInputChange}
                        className="h-12 border-2 border-muted focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <Label htmlFor="availability_end" className="text-sm font-medium text-foreground">
                        End Time
                      </Label>
                      <Input
                        id="availability_end"
                        name="availability_end"
                        type="time"
                        value={formData.availability_end}
                        onChange={handleInputChange}
                        className="h-12 border-2 border-muted focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Type Specific Fields */}
            {formData.service_type === 'onsite' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Location & Coverage</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-foreground">
                      Primary Location *
                    </Label>
                    <Select 
                      value={formData.location} 
                      onValueChange={(value) => handleSelectChange("location", value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-muted focus:border-primary">
                        <SelectValue placeholder="Select your primary location" />
                      </SelectTrigger>
                      <SelectContent>
                        {TUNISIAN_LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Areas Covered (optional)
                    </Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newAreaCovered}
                          onChange={(e) => setNewAreaCovered(e.target.value)}
                          placeholder="Add area you cover"
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAreaCovered())}
                        />
                        <Button type="button" onClick={addAreaCovered} size="sm">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.area_covered.map((area, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeAreaCovered(area)}
                          >
                            {area} ✕
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Online Service Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="delivery_time" className="text-sm font-medium text-foreground">
                      Delivery Time
                    </Label>
                    <Select 
                      value={formData.delivery_time} 
                      onValueChange={(value) => handleSelectChange("delivery_time", value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-muted focus:border-primary">
                        <SelectValue placeholder="Select expected delivery time" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_TIME_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <CategorizedSkillsSelector
                    value={formData.skills_tools}
                    onChange={(skills) => setFormData(prev => ({ ...prev, skills_tools: skills }))}
                    placeholder="Search and select your skills & tools..."
                  />
                </div>
              </div>
            )}

            {/* Portfolio Examples - Only for Online Services */}
            {formData.service_type === 'online' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Portfolio Examples</h3>
                </div>
                
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-muted">
                  <MultiServicePhotoUpload
                    onPhotosChange={setSelectedPhotos}
                    selectedPhotos={selectedPhotos}
                    businessName={formData.service_title || "Service"}
                    maxPhotos={5}
                  />
                </div>
              </div>
            )}

            {/* Subscription Plan Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Subscription Plan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "basic", label: "Basic", desc: "Essential features", color: "border-muted" },
                  { value: "premium", label: "Premium", desc: "Advanced features", color: "border-primary" },
                  { value: "enterprise", label: "Enterprise", desc: "Full access", color: "border-accent" }
                ].map((plan) => (
                  <div
                    key={plan.value}
                    onClick={() => handleSelectChange("subscription_plan", plan.value)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      formData.subscription_plan === plan.value 
                        ? `${plan.color} bg-gradient-to-br from-primary/5 to-accent/5` 
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold text-foreground">{plan.label}</h4>
                      <p className="text-sm text-muted-foreground">{plan.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  Posting Your {formData.service_type === 'onsite' ? 'On-site' : 'Online'} Service...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Launch Your {formData.service_type === 'onsite' ? 'On-site' : 'Online'} Service
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};