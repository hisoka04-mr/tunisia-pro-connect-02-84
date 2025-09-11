import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBookings } from "@/hooks/useBookings";
import { CheckCircle, XCircle, Clock, User, Calendar, MapPin, MessageCircle } from "lucide-react";

interface BookingRequestCardProps {
  booking: {
    id: string;
    booking_date: string;
    booking_time: string;
    total_price: number;
    status: string;
    notes?: string;
    client_id: string;
    service_id: string;
  };
  onStatusUpdate?: () => void;
  onOpenChat?: (booking: any) => void;
}

export const BookingRequestCard = ({ booking, onStatusUpdate, onOpenChat }: BookingRequestCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { updateBookingStatus, deleteBooking } = useBookings();

  const handleAccept = async () => {
    console.log('BookingRequestCard: Accepting booking:', booking.id);
    setIsUpdating(true);
    try {
      const success = await updateBookingStatus(booking.id, 'confirmed');
      
      if (success) {
        console.log('BookingRequestCard: Booking accepted successfully');
        onStatusUpdate?.();
      }
    } catch (error: any) {
      console.error('BookingRequestCard: Failed to accept booking:', error);
      toast({
        title: "Error accepting booking",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    console.log('BookingRequestCard: Declining booking:', booking.id);
    setIsUpdating(true);
    try {
      const success = await deleteBooking(booking.id);
      
      if (success) {
        console.log('BookingRequestCard: Booking declined successfully');
        onStatusUpdate?.();
      }
    } catch (error: any) {
      console.error('BookingRequestCard: Failed to decline booking:', error);
      toast({
        title: "Error declining booking",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Booking Request
          </CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            <Clock className="h-3 w-3 mr-1" />
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Date & Time</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{formatDate(booking.booking_date)}</p>
                  <p className="text-sm text-gray-600">{formatTime(booking.booking_time)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Price</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-lg font-bold text-green-600">
                {booking.total_price} TND
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Additional Notes</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm">{booking.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAccept}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isUpdating}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {/* Chat Access for Confirmed Bookings */}
        {booking.status === 'confirmed' && onOpenChat && (
          <div className="pt-4">
            <Button
              onClick={() => onOpenChat(booking)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
              variant="default"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ouvrir le Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};