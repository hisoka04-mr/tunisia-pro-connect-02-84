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
import BookingCalendar from "@/components/BookingCalendar";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { Send } from "lucide-react";

interface OnSiteBookingFormProps {
  providerId: string;
  providerName: string;
  preselectedDate?: string;
  preselectedTime?: string;
}

const OnSiteBookingForm = ({ 
  providerId, 
  providerName, 
  preselectedDate, 
  preselectedTime 
}: OnSiteBookingFormProps) => {
  const [serviceDetails, setServiceDetails] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState(preselectedDate || "");
  const [time, setTime] = useState(preselectedTime || "");
  const [urgency, setUrgency] = useState("normal");
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(preselectedDate && preselectedTime ? 2 : 1);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { createBooking, loading: bookingLoading } = useBookings();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a service",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const booking = await createBooking({
        booking_date: date,
        booking_time: time,
        service_provider_id: providerId,
        notes: `Service Details: ${serviceDetails}. Address: ${address}, ${city}. Urgency: ${urgency}`,
        duration_hours: 2,
      });

      if (booking) {
        toast({
          title: "Booking Submitted",
          description: "Your on-site service request has been submitted successfully",
        });
        navigate("/bookings");
      }
    } catch (error) {
      console.error("Booking submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingComplete = (booking: { date: Date; time: string; providerId: string }) => {
    setDate(booking.date.toISOString().split('T')[0]);
    setTime(booking.time);
    setStep(2);
    
    toast({
      title: "Appointment Selected",
      description: `Your appointment has been set for ${booking.date.toLocaleDateString()} at ${booking.time}`,
    });
  };

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Schedule On-Site Service</h2>
          <p className="text-gray-600">Select your preferred date and time</p>
        </div>
        <BookingCalendar 
          providerId={providerId} 
          providerName={providerName}
          providerPhoto={null}
          onBookingComplete={handleBookingComplete}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>On-Site Service Details</CardTitle>
            <CardDescription>
              Provide location and service details for your appointment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Selected Provider Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Selected Provider: {providerName}</p>
              <p className="text-sm text-gray-600">
                Appointment: {new Date(date).toLocaleDateString()} at {time}
              </p>
            </div>

            {/* Service Details */}
            <div className="space-y-2">
              <Label htmlFor="service-details">Describe your needs</Label>
              <Textarea 
                id="service-details" 
                placeholder="Please provide details about the service you need..."
                value={serviceDetails}
                onChange={(e) => setServiceDetails(e.target.value)}
                required
                rows={4}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Service Address</Label>
              <Input 
                id="address" 
                placeholder="Enter the address where service is needed"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select value={city} onValueChange={setCity} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunis">Tunis</SelectItem>
                  <SelectItem value="aryana">Aryana</SelectItem>
                  <SelectItem value="ben-arous">Ben Arous</SelectItem>
                  <SelectItem value="manouba">Manouba</SelectItem>
                  <SelectItem value="nabeul">Nabeul</SelectItem>
                  <SelectItem value="sousse">Sousse</SelectItem>
                  <SelectItem value="sfax">Sfax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label>Urgency</Label>
              <RadioGroup value={urgency} onValueChange={setUrgency}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent">Urgent - As soon as possible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">Normal - Within the next few days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled">Scheduled - On the preferred date</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1 h-4 w-4 text-primary border-2 border-input rounded focus:ring-primary focus:ring-2"
                checked={agree}
                onChange={(e) => {
                  console.log('Checkbox clicked, new value:', e.target.checked);
                  setAgree(e.target.checked);
                }}
                required
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I agree to the terms and conditions and consent to the processing of my personal data.
              </Label>
            </div>
          </CardContent>

          <div className="flex justify-between p-6">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back to Calendar
            </Button>
            <div className="flex flex-col items-end gap-2">
              {/* Debug info */}
              <div className="text-xs text-gray-500">
                Debug: agree={agree.toString()}, isSubmitting={isSubmitting.toString()}, bookingLoading={bookingLoading.toString()}
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || bookingLoading || !agree}
                className="group relative overflow-hidden w-full rounded-3xl h-14 px-8 bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/95 hover:via-primary/95 hover:to-accent/95 text-primary-foreground font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] transform hover:scale-[1.02] transition-all duration-500 ease-out disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                onClick={() => console.log('Button clicked, disabled state:', isSubmitting || bookingLoading || !agree)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="relative z-10 flex items-center justify-center">
                  {isSubmitting || bookingLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-3 border-white/30 border-t-white rounded-full mr-3"></div>
                      <span className="tracking-wide">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
                      <span className="tracking-wide">Submit Booking Request</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OnSiteBookingForm;