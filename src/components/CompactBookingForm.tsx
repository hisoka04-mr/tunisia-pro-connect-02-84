import { useState, useEffect } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BookingCalendar from "@/components/BookingCalendar";
import { BookingSuccessNotification } from "@/components/BookingSuccessNotification";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { Send, User, CalendarIcon, MapPin, CheckCircle } from "lucide-react";

const CompactBookingForm = () => {
  const [serviceDetails, setServiceDetails] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerName, setProviderName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<any>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { createBooking, loading: bookingLoading } = useBookings();
  const { user } = useAuth();

  // Service type is locked - client already knows what service they want
  const lockedServiceType = "Service professionnel";

  // Check if we came from ServiceDetail with pre-filled data
  useEffect(() => {
    if (location.state) {
      const { providerId, providerName: name, date: preDate, time: preTime } = location.state;
      if (providerId && name && preDate && preTime) {
        setSelectedProviderId(providerId);
        setProviderName(name);
        setDate(typeof preDate === 'string' ? preDate : preDate.toISOString().split('T')[0]);
        setTime(preTime);
        setStep(2); // Skip calendar and go directly to service details
      }
    }
  }, [location.state]);

  const serviceProvider = {
    id: selectedProviderId || "pro1",
    name: providerName || "Ahmed Benali",
    profession: "Professional",
    photo: null
  };

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

    if (!selectedProviderId) {
      toast({
        title: "Provider not selected",
        description: "Please select a service provider",
        variant: "destructive",
      });
      return;
    }

    if (!serviceDetails || !address || !city) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const booking = await createBooking({
        booking_date: date,
        booking_time: time,
        service_provider_id: selectedProviderId,
        notes: `${lockedServiceType}: ${serviceDetails}. Address: ${address}, ${city}. Urgency: ${urgency}`,
        duration_hours: 2,
      });

      if (booking) {
        setCompletedBooking({
          id: booking.id,
          providerName,
          date,
          time
        });
        setShowSuccess(true);
      } else {
        toast({
          title: "Booking failed",
          description: "Unable to create booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Booking submission error:", error);
      toast({
        title: "Booking failed",
        description: "An error occurred while creating the booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingComplete = (booking: { date: Date; time: string; providerId: string }) => {
    setDate(booking.date.toISOString().split('T')[0]);
    setTime(booking.time);
    setSelectedProviderId(booking.providerId);
    setStep(2);
    
    toast({
      title: "Appointment Selected",
      description: `Your appointment has been set for ${booking.date.toLocaleDateString()} at ${booking.time}`,
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Réservez votre service
              </h1>
              <p className="text-muted-foreground">
                Planifiez rapidement votre rendez-vous
              </p>
            </div>

            {step === 1 ? (
              <Card className="shadow-lg">
                <CardHeader className="text-center pb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Choisissez votre créneau</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingCalendar 
                    providerId={serviceProvider.id} 
                    providerName={serviceProvider.name}
                    providerPhoto={serviceProvider.photo}
                    onBookingComplete={handleBookingComplete}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader className="text-center pb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <User className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Détails du service</CardTitle>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    {/* Selected Provider Info */}
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Prestataire: {serviceProvider.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {new Date(date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric',
                              month: 'long'
                            })} à {time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Locked Service Type Display */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Type de Service</Label>
                      <div className="p-3 bg-muted/30 rounded-lg border border-dashed flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{lockedServiceType}</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Le type de service est prédéfini selon votre sélection
                      </p>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-2">
                      <Label htmlFor="service-details" className="text-sm font-medium">
                        Description du besoin *
                      </Label>
                      <Textarea 
                        id="service-details" 
                        placeholder="Décrivez votre besoin en détail..."
                        value={serviceDetails}
                        onChange={(e) => setServiceDetails(e.target.value)}
                        required
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">
                          Adresse *
                        </Label>
                        <Input 
                          id="address" 
                          placeholder="Votre adresse"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                          className="h-10"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          Ville *
                        </Label>
                        <Select value={city} onValueChange={setCity} required>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Choisissez" />
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
                    </div>

                    {/* Urgency */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Urgence</Label>
                      <RadioGroup value={urgency} onValueChange={setUrgency} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="urgent" id="urgent" />
                          <Label htmlFor="urgent" className="text-sm cursor-pointer">
                            Urgent - Le plus tôt possible
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="normal" id="normal" />
                          <Label htmlFor="normal" className="text-sm cursor-pointer">
                            Normal - Dans les prochains jours
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="scheduled" id="scheduled" />
                          <Label htmlFor="scheduled" className="text-sm cursor-pointer">
                            Planifié - À la date choisie
                          </Label>
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
                        onChange={(e) => setAgree(e.target.checked)}
                        required
                      />
                      <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                        J'accepte les conditions d'utilisation et consens au traitement de mes données personnelles.
                      </Label>
                    </div>
                  </CardContent>

                  <div className="flex justify-between p-6 border-t bg-muted/20">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Retour au calendrier
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || bookingLoading || !agree}
                      className="flex items-center gap-2 min-w-[140px]"
                    >
                      {isSubmitting || bookingLoading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Confirmer</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showSuccess && completedBooking && (
        <BookingSuccessNotification 
          bookingId={completedBooking.id}
          providerName={completedBooking.providerName}
          bookingDate={completedBooking.date}
          bookingTime={completedBooking.time}
          onClose={() => setShowSuccess(false)} 
        />
      )}
    </>
  );
};

export default CompactBookingForm;