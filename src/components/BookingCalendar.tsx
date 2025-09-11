
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TimePicker from "./TimePicker";
import { Clock, CalendarIcon, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  providerId: string;
  providerName: string;
  providerPhoto?: string | null;
  providerLocation?: string;
  onBookingComplete?: (booking: {
    date: Date;
    time: string;
    providerId: string;
  }) => void;
}

const BookingCalendar = ({
  providerId,
  providerName,
  providerPhoto,
  providerLocation,
  onBookingComplete
}: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const handleBooking = () => {
    if (selectedDate && selectedTime && onBookingComplete) {
      onBookingComplete({
        date: selectedDate,
        time: selectedTime,
        providerId
      });
    }
  };

  const selectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  };

  const selectNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedDate(nextWeek);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage 
              src={providerPhoto || undefined}
              alt={providerName}
              loading="lazy"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {providerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SP'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">Book an appointment</CardTitle>
            <p className="text-sm text-muted-foreground mb-1">with {providerName}</p>
            {providerLocation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {providerLocation}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Date Selection */}
        <div>
          <h3 className="text-sm font-medium mb-3">Quick booking options</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={selectTomorrow}
              className="text-xs"
            >
              Tomorrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectNextWeek}
              className="text-xs"
            >
              Next Week
            </Button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Select Date</h4>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }}
                disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Select Time</h4>
          <Button
            variant="outline"
            onClick={() => setShowTimePicker(true)}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedTime && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {selectedTime || "Select time"}
          </Button>
        </div>

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium mb-2 text-primary">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Date:</strong> {format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Provider:</strong> {providerName}</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          disabled={!selectedDate || !selectedTime}
          onClick={handleBooking}
          size="lg"
        >
          Continue to Book Appointment
        </Button>
      </CardFooter>
      
      <TimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={setSelectedTime}
        selectedTime={selectedTime}
      />
    </Card>
  );
};

export default BookingCalendar;
