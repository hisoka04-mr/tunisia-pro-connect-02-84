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
  CardDescription,
  CardFooter,
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
import { Send, User, CalendarIcon } from "lucide-react";

const BookingForm = () => {
  const [serviceType, setServiceType] = useState("");
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

  // Check if we came from ServiceDetail with pre-filled data
  useEffect(() => {
    if (location.state) {
      const { providerId, providerName: name, date: preDate, time: preTime, serviceId: sId } = location.state;
      if (providerId && name && preDate && preTime) {
        setSelectedProviderId(providerId);
        setProviderName(name);
        setDate(typeof preDate === 'string' ? preDate : preDate.toISOString().split('T')[0]);
        setTime(preTime);
        setStep(2); // Skip calendar and go directly to service details
      }
    }
  }, [location.state]);

  // Mock service provider data - use dynamic data if available
  const serviceProvider = {
    id: selectedProviderId || "pro1",
    name: providerName || "Ahmed Benali",
    profession: "Professional",
    photo: null // Could be populated from actual provider data in the future
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 Starting booking submission...");
    console.log("📅 Booking data:", {
      date,
      time,
      selectedProviderId,
      serviceType,
      serviceDetails,
      address,
      city,
      urgency
    });
    
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

    if (!serviceType || !serviceDetails || !address || !city) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("🔄 Creating booking with provider ID:", selectedProviderId);
      const booking = await createBooking({
        booking_date: date,
        booking_time: time,
        service_provider_id: selectedProviderId,
        notes: `${serviceType}: ${serviceDetails}. Address: ${address}, ${city}. Urgency: ${urgency}`,
        duration_hours: 2, // Default duration
      });

      console.log("📋 Booking result:", booking);

      if (booking) {
        console.log("✅ Booking created successfully, showing success notification");
        setCompletedBooking({
          id: booking.id,
          providerName,
          date,
          time
        });
        setShowSuccess(true);
      } else {
        console.log("❌ Booking creation returned null");
        toast({
          title: "Booking failed",
          description: "Unable to create booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Booking submission error:", error);
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
    // Set the date and time from the calendar
    setDate(booking.date.toISOString().split('T')[0]);
    setTime(booking.time);
    setSelectedProviderId(booking.providerId);
    setStep(2); // Move to next step
    
    toast({
      title: "Appointment Selected",
      description: `Your appointment has been set for ${booking.date.toLocaleDateString()} at ${booking.time}`,
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 -right-32 w-96 h-96 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-accent/20 via-accent/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-accent/40 rounded-full animate-bounce delay-700"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/60 rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in shadow-lg">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Réservation Instantanée
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold mb-8 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-[0.9] tracking-tight">
                Réservez votre
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Service</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed font-light">
                Une expérience de réservation repensée pour un service professionnel d'exception
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-12">
                <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-400/10 backdrop-blur-sm border border-emerald-400/20 text-emerald-600 text-sm font-medium shadow-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
                  Service le jour même
                </div>
                <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-400/10 backdrop-blur-sm border border-blue-400/20 text-blue-600 text-sm font-medium shadow-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse delay-200"></div>
                  Professionnels vérifiés
                </div>
                <div className="inline-flex items-center px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-purple-400/10 backdrop-blur-sm border border-purple-400/20 text-purple-600 text-sm font-medium shadow-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse delay-400"></div>
                  Satisfaction garantie
                </div>
              </div>
            </div>

            {step === 1 ? (
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-background/40 to-background/60 backdrop-blur-xl overflow-hidden relative">
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm"></div>
                <div className="absolute inset-0 border border-white/10 rounded-3xl"></div>
                
                <CardHeader className="relative text-center pb-8 pt-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/10 text-primary mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse"></div>
                    <CalendarIcon className="w-10 h-10 relative z-10" />
                  </div>
                  <CardTitle className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 tracking-tight">
                    Choisissez votre créneau
                  </CardTitle>
                  <CardDescription className="text-xl text-muted-foreground/80 font-light">
                    Sélectionnez la date et l'heure qui vous conviennent le mieux
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative p-10">
                  <BookingCalendar 
                    providerId={serviceProvider.id} 
                    providerName={serviceProvider.name}
                    providerPhoto={serviceProvider.photo}
                    onBookingComplete={handleBookingComplete}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-background/40 to-background/60 backdrop-blur-xl overflow-hidden relative">
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm"></div>
                <div className="absolute inset-0 border border-white/10 rounded-3xl"></div>
                
                <form onSubmit={handleSubmit}>
                  <CardHeader className="relative text-center pb-8 pt-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/10 text-primary mb-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse"></div>
                      <User className="w-10 h-10 relative z-10" />
                    </div>
                    <CardTitle className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 tracking-tight">
                      Détails du Service
                    </CardTitle>
                    <CardDescription className="text-xl text-muted-foreground/80 font-light">
                      Décrivez votre besoin pour une expérience personnalisée
                    </CardDescription>
                  </CardHeader>
                
                  <CardContent className="relative space-y-10 p-10">
                    {/* Selected Provider Info */}
                    <div className="p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 backdrop-blur-sm rounded-3xl border border-primary/20 shadow-xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                      <div className="flex items-center space-x-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          <User className="w-8 h-8 relative z-10" />
                        </div>
                        <div>
                          <p className="font-bold text-xl text-primary mb-2">Prestataire: {serviceProvider.name}</p>
                          <p className="text-muted-foreground flex items-center text-lg">
                            <CalendarIcon className="w-5 h-5 mr-3" />
                            {new Date(date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })} à {time}
                          </p>
                        </div>
                      </div>
                    </div>

                  {/* Service Type */}
                  <div className="space-y-4">
                    <Label htmlFor="service-type" className="text-lg font-semibold text-foreground">Type de Service</Label>
                    <Select value={serviceType} onValueChange={setServiceType} required>
                      <SelectTrigger className="h-14 rounded-2xl border-white/20 bg-background/50 backdrop-blur-sm text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                        <SelectValue placeholder="Sélectionnez un service" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/20 bg-background/95 backdrop-blur-xl">
                        <SelectItem value="plumbing">Plomberie</SelectItem>
                        <SelectItem value="electrical">Électricité</SelectItem>
                        <SelectItem value="carpentry">Menuiserie</SelectItem>
                        <SelectItem value="cleaning">Nettoyage</SelectItem>
                        <SelectItem value="painting">Peinture</SelectItem>
                        <SelectItem value="tutoring">Cours particuliers</SelectItem>
                        <SelectItem value="beauty">Beauté & Soins</SelectItem>
                        <SelectItem value="fitness">Fitness & Santé</SelectItem>
                        <SelectItem value="automotive">Automobile</SelectItem>
                        <SelectItem value="gardening">Jardinage</SelectItem>
                        <SelectItem value="technology">Technologie & IT</SelectItem>
                        <SelectItem value="photography">Photographie</SelectItem>
                        <SelectItem value="catering">Traiteur</SelectItem>
                        <SelectItem value="pet-care">Soins animaux</SelectItem>
                        <SelectItem value="moving">Déménagement</SelectItem>
                        <SelectItem value="event-planning">Événementiel</SelectItem>
                        <SelectItem value="legal">Juridique</SelectItem>
                        <SelectItem value="accounting">Comptabilité</SelectItem>
                        <SelectItem value="translation">Traduction</SelectItem>
                        <SelectItem value="music">Musique</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    <Label htmlFor="service-details" className="text-lg font-semibold text-foreground">Description du besoin</Label>
                    <Textarea 
                      id="service-details" 
                      placeholder="Décrivez en détail le service dont vous avez besoin..."
                      value={serviceDetails}
                      onChange={(e) => setServiceDetails(e.target.value)}
                      required
                      rows={5}
                      className="rounded-2xl border-white/20 bg-background/50 backdrop-blur-sm text-lg shadow-lg hover:shadow-xl transition-all duration-300 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Address */}
                    <div className="space-y-4">
                      <Label htmlFor="address" className="text-lg font-semibold text-foreground">Adresse</Label>
                      <Input 
                        id="address" 
                        placeholder="Votre adresse complète"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="h-14 rounded-2xl border-white/20 bg-background/50 backdrop-blur-sm text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-4">
                      <Label htmlFor="city" className="text-lg font-semibold text-foreground">Ville</Label>
                      <Select value={city} onValueChange={setCity} required>
                        <SelectTrigger className="h-14 rounded-2xl border-white/20 bg-background/50 backdrop-blur-sm text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                          <SelectValue placeholder="Sélectionnez votre ville" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/20 bg-background/95 backdrop-blur-xl">
                          <SelectItem value="tunis">Tunis</SelectItem>
                          <SelectItem value="aryanah">Ariana</SelectItem>
                          <SelectItem value="ben-arous">Ben Arous</SelectItem>
                          <SelectItem value="manouba">Manouba</SelectItem>
                          <SelectItem value="nabeul">Nabeul</SelectItem>
                          <SelectItem value="zaghouan">Zaghouan</SelectItem>
                          <SelectItem value="bizerte">Bizerte</SelectItem>
                          <SelectItem value="beja">Béja</SelectItem>
                          <SelectItem value="jendouba">Jendouba</SelectItem>
                          <SelectItem value="kef">Kef</SelectItem>
                          <SelectItem value="siliana">Siliana</SelectItem>
                          <SelectItem value="kairouan">Kairouan</SelectItem>
                          <SelectItem value="kasserine">Kasserine</SelectItem>
                          <SelectItem value="sidi-bouzid">Sidi Bouzid</SelectItem>
                          <SelectItem value="sousse">Sousse</SelectItem>
                          <SelectItem value="monastir">Monastir</SelectItem>
                          <SelectItem value="mahdia">Mahdia</SelectItem>
                          <SelectItem value="sfax">Sfax</SelectItem>
                          <SelectItem value="gafsa">Gafsa</SelectItem>
                          <SelectItem value="tozeur">Tozeur</SelectItem>
                          <SelectItem value="kebili">Kebili</SelectItem>
                          <SelectItem value="gabes">Gabès</SelectItem>
                          <SelectItem value="medenine">Médenine</SelectItem>
                          <SelectItem value="tataouine">Tataouine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Urgency */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold text-foreground">Niveau d'urgence</Label>
                    <RadioGroup value={urgency} onValueChange={setUrgency} className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-4 p-4 rounded-2xl bg-background/30 backdrop-blur-sm border border-white/10 hover:bg-background/50 transition-all duration-300 cursor-pointer">
                        <RadioGroupItem value="urgent" id="urgent" className="border-primary text-primary" />
                        <Label htmlFor="urgent" className="flex-1 cursor-pointer">
                          <div className="font-medium">Urgent</div>
                          <div className="text-sm text-muted-foreground">Intervention dans les 24h</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-4 p-4 rounded-2xl bg-background/30 backdrop-blur-sm border border-white/10 hover:bg-background/50 transition-all duration-300 cursor-pointer">
                        <RadioGroupItem value="normal" id="normal" className="border-primary text-primary" />
                        <Label htmlFor="normal" className="flex-1 cursor-pointer">
                          <div className="font-medium">Normal</div>
                          <div className="text-sm text-muted-foreground">Dans les prochains jours</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-4 p-4 rounded-2xl bg-background/30 backdrop-blur-sm border border-white/10 hover:bg-background/50 transition-all duration-300 cursor-pointer">
                        <RadioGroupItem value="scheduled" id="scheduled" className="border-primary text-primary" />
                        <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                          <div className="font-medium">Planifié</div>
                          <div className="text-sm text-muted-foreground">À la date préférée</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start space-x-4 p-6 rounded-2xl bg-gradient-to-r from-muted/30 to-muted/20 backdrop-blur-sm border border-white/10">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      className="mt-1 w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary"
                      checked={agree}
                      onChange={(e) => {
                        console.log("📋 Checkbox changed:", e.target.checked);
                        console.log("📋 Previous agree state:", agree);
                        setAgree(e.target.checked);
                      }}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      J'accepte les <a href="#" className="text-primary hover:underline font-medium">conditions d'utilisation</a> et consens au traitement de mes données personnelles.
                    </Label>
                  </div>
                </CardContent>

                  <CardFooter className="flex flex-col sm:flex-row gap-6 pt-12 p-10">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      className="h-14 px-8 rounded-2xl border-white/30 bg-background/30 backdrop-blur-sm hover:bg-background/60 hover:scale-[1.02] transition-all duration-300 text-lg font-medium"
                    >
                      <CalendarIcon className="w-5 h-5 mr-3" />
                      Retour au Calendrier
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!agree || isSubmitting || bookingLoading}
                      className="flex-1 group relative overflow-hidden rounded-3xl h-16 px-8 bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/95 hover:via-primary/95 hover:to-accent/95 text-primary-foreground font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] transform hover:scale-[1.02] transition-all duration-500 ease-out disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        {isSubmitting || bookingLoading ? (
                          <>
                            <div className="animate-spin w-6 h-6 border-3 border-white/30 border-t-white rounded-full mr-3"></div>
                            <span className="tracking-wide">Traitement en cours...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
                            <span className="tracking-wide">Confirmer la Réservation</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </CardFooter>
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

export default BookingForm;
