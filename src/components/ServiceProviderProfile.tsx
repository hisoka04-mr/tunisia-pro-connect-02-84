
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TimePicker from "./TimePicker";
import { ChatProviderButton } from "@/components/chat/ChatProviderButton";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Star, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ServiceProviderProfileProps {
  id: string;
  name: string;
  profession: string;
  rating: number;
  completedJobs: number;
  image: string;
  bio: string;
  hourlyRate: number;
  languages: string[];
}

const ServiceProviderProfile = ({
  id,
  name,
  profession,
  rating,
  completedJobs,
  image,
  bio,
  hourlyRate,
  languages
}: ServiceProviderProfileProps) => {
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showBooking, setShowBooking] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  return (
    <div className="mt-8 space-y-6">
      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/20">
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5" />
          
          <CardHeader className="relative pb-8 pt-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-xl ring-4 ring-background relative group">
                  <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {/* Status Badge */}
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  Available
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                    {name}
                  </h1>
                  <p className="text-xl text-primary font-semibold mb-4">{profession}</p>
                  
                  {/* Rating Section */}
                  <div className="flex items-center justify-center lg:justify-start mb-6">
                    <div className="flex bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="ml-4 bg-muted px-3 py-1 rounded-full">
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                      <span className="text-muted-foreground ml-1">({completedJobs} jobs)</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button 
                    onClick={() => setShowBooking(prev => !prev)} 
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {showBooking ? "Hide Booking" : "Book Now"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 hover:bg-muted/50 transition-all duration-300"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Ask for Service
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </div>
      </Card>

      {/* About & Details Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          {/* About Section */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
              About
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{bio}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hourly Rate Card */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  💰
                </div>
                <h3 className="font-semibold text-lg">Hourly Rate</h3>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {hourlyRate} TND
              </p>
            </div>

            {/* Languages Card */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  🌐
                </div>
                <h3 className="font-semibold text-lg">Languages</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <Badge 
                    key={language} 
                    variant="secondary"
                    className="px-3 py-1 bg-gradient-to-r from-muted to-muted/80 hover:from-primary/20 hover:to-accent/20 transition-all duration-300"
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Section */}
      {showBooking && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="max-w-md mx-auto">
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
                <CalendarIcon className="w-6 h-6 text-primary" />
                Book an Appointment
              </h3>
              
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-foreground">Select a date</label>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setDate(tomorrow);
                    }}
                    className={cn(
                      "w-full justify-start text-left font-normal border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 h-12",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date (tomorrow)</span>}
                  </Button>
                </div>
                
                {/* Time Picker */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-foreground">
                    Select a time
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowTimePicker(true)}
                    className={cn(
                      "w-full justify-start text-left font-normal border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 h-12",
                      !selectedTime && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {selectedTime || "Select time"}
                  </Button>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-4 space-y-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 h-12" 
                    disabled={!date || !selectedTime}
                    onClick={() => {
                      if (date && selectedTime) {
                        navigate("/booking", { 
                          state: { 
                            providerId: id,
                            providerName: name,
                            date: date,
                            time: selectedTime
                          } 
                        });
                      }
                    }}
                  >
                    Continue Booking
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 transition-all duration-300 h-12"
                  >
                    💬 Contact via WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <TimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={setSelectedTime}
        selectedTime={selectedTime}
      />
    </div>
  );
};

export default ServiceProviderProfile;
