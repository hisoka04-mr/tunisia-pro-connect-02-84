import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ChatButtonProps {
  bookingId?: string;
  className?: string;
}

export const ChatButton = ({ bookingId, className }: ChatButtonProps) => {
  return (
    <Link to="/chat">
      <Button 
        variant="outline" 
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
        Chat
      </Button>
    </Link>
  );
};