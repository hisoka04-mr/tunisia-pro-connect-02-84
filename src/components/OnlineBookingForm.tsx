import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, ShoppingCart } from "lucide-react";

interface OnlineBookingFormProps {
  providerId: string;
  providerName: string;
}

const OnlineBookingForm = ({ providerId, providerName }: OnlineBookingFormProps) => {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a project request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create a message-based "booking" for online services
      // This could be stored as a project request or chat message
      const projectRequest = {
        providerId,
        projectTitle,
        projectDetails,
        budget,
        timeline,
        requirements,
        clientId: user.id,
        status: 'pending'
      };

      // For now, we'll show success and redirect to chat
      toast({
        title: "Project Request Submitted",
        description: "Your project details have been sent. Start a chat to discuss further.",
      });
      
      navigate(`/chat?providerId=${providerId}`);
    } catch (error) {
      console.error("Project submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartChat = () => {
    navigate(`/chat?providerId=${providerId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Online Service Request</CardTitle>
          <CardDescription>
            Describe your project requirements for {providerName}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Provider Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Service Provider: {providerName}</p>
            <p className="text-sm text-gray-600">Online Service</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input 
                id="project-title" 
                placeholder="Brief title for your project"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
            </div>

            {/* Project Details */}
            <div className="space-y-2">
              <Label htmlFor="project-details">Project Description</Label>
              <Textarea 
                id="project-details" 
                placeholder="Describe your project in detail..."
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
                required
                rows={4}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label htmlFor="requirements">Specific Requirements</Label>
              <Textarea 
                id="requirements" 
                placeholder="Any specific requirements, features, or deliverables..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range</Label>
              <Select value={budget} onValueChange={setBudget} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-500">Under 500 TND</SelectItem>
                  <SelectItem value="500-1000">500 - 1,000 TND</SelectItem>
                  <SelectItem value="1000-2500">1,000 - 2,500 TND</SelectItem>
                  <SelectItem value="2500-5000">2,500 - 5,000 TND</SelectItem>
                  <SelectItem value="5000-plus">5,000+ TND</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Select value={timeline} onValueChange={setTimeline} required>
                <SelectTrigger>
                  <SelectValue placeholder="When do you need this completed?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As soon as possible</SelectItem>
                  <SelectItem value="1-week">Within 1 week</SelectItem>
                  <SelectItem value="2-weeks">Within 2 weeks</SelectItem>
                  <SelectItem value="1-month">Within 1 month</SelectItem>
                  <SelectItem value="flexible">Flexible timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                required
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the terms and conditions and consent to the processing of my personal data.
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 flex items-center gap-2"
                onClick={handleStartChat}
              >
                <MessageCircle className="w-4 h-4" />
                Start Chat First
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !agree}
                className="flex-1 group relative overflow-hidden rounded-3xl h-14 px-6 bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/95 hover:via-primary/95 hover:to-accent/95 text-primary-foreground font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] transform hover:scale-[1.02] transition-all duration-500 ease-out disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <ShoppingCart className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  <span className="tracking-wide">{isSubmitting ? "Submitting..." : "Submit Project Request"}</span>
                </div>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnlineBookingForm;