import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingSuccessNotificationProps {
  bookingId: string;
  providerName: string;
  bookingDate: string;
  bookingTime: string;
  onClose: () => void;
}

export const BookingSuccessNotification = ({
  bookingId,
  providerName,
  bookingDate,
  bookingTime,
  onClose
}: BookingSuccessNotificationProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleViewBookings = () => {
    navigate('/bookings');
    onClose();
  };

  const handleStartChat = () => {
    navigate('/chat');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-background shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-green-700">Booking Request Sent!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h4 className="font-semibold mb-2">Booking Details</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Provider:</strong> {providerName}</p>
              <p><strong>Date:</strong> {new Date(bookingDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {bookingTime}</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-4">
              Your booking request has been sent to <strong>{providerName}</strong>. 
              They will review your request and respond within 24 hours.
            </p>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-xs">
                💡 <strong>What happens next?</strong><br/>
                • The service provider will review your request<br/>
                • You'll get a notification when they respond<br/>
                • If accepted, a chat room will be created for communication
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleViewBookings}
              className="w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View My Bookings
            </Button>
            <Button 
              onClick={handleStartChat}
              variant="outline"
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Go to Chat
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};