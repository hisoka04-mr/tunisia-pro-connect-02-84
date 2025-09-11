import { BookingManagement } from "@/components/BookingManagement";
import { NotificationProvider } from "@/components/NotificationProvider";

const Bookings = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <NotificationProvider />
      <BookingManagement />
    </div>
  );
};

export default Bookings;