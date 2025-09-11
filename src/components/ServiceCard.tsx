
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, User, Clock } from "lucide-react";

interface ServiceCardProps {
  id: string;
  title: string; // This will be the provider's name
  description: string;
  category?: string;
  location?: string;
  rating?: number | null;
  profilePhoto?: string | null;
  servicePhoto?: string | null; // Added for service photos
  icon?: React.ReactNode;
  price?: string;
  businessName?: string; // Optional business name to show separately
  serviceType?: 'onsite' | 'online'; // New prop for service type
}

const ServiceCard = ({ 
  id, 
  title, 
  description, 
  category, 
  location, 
  rating, 
  profilePhoto,
  servicePhoto, 
  icon, 
  price,
  businessName,
  serviceType 
}: ServiceCardProps) => {
  return (
    <Card className="service-card w-full max-w-xs mx-auto bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden border border-border/20">
      {/* Profile Photo Section */}
      <div className="relative">
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/90 text-primary-foreground">
            PREMIUM
          </Badge>
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-accent/90 text-accent-foreground">
            FEATURED
          </Badge>
        </div>

        {/* Profile Photo */}
        <div className="w-full h-32 bg-muted flex items-center justify-center">
          {profilePhoto || servicePhoto ? (
            <img 
              src={profilePhoto || servicePhoto || ""}
              alt={`${title} profile`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgOCAxNSAxMiAxNUMxNiAxNSAyMSAxNi4zMyAyMSAxOVoiIGZpbGw9IiNjY2MiLz4KPC9zdmc+";
              }}
            />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Content */}
      <CardContent className="p-3">
        {/* Name and Rating */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-base text-foreground truncate">{title}</h3>
          {rating !== undefined && rating !== null && rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm text-foreground">{rating.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            </div>
          )}
        </div>
        
        {/* Category/Title */}
        {category && (
          <p className="text-primary font-medium text-sm mb-2">{category}</p>
        )}
        
        {/* Price */}
        {price && (
          <p className="text-foreground font-medium text-sm mb-2">
            From <span className="font-semibold">{price}</span>
          </p>
        )}
        
        {/* Same-day service */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-green-600 font-medium text-xs">Same-day available</span>
        </div>
      </CardContent>
      
      {/* Footer */}
      <CardFooter className="p-3 pt-0">
        <Link to={`/service/${id}`} className="w-full">
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
