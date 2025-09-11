
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, Star, Shield, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-muted/50 border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h3 className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SeviGOTN
              </h3>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-md">
              Your trusted marketplace for home services in Tunisia. 
              Connect with verified professionals and book quality services with confidence.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                <Shield className="w-4 h-4" />
                Verified Pros
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                <Star className="w-4 h-4" />
                4.9 Rating
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                <Clock className="w-4 h-4" />
                Same Day Service
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Tunisia, All Governorates</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-primary" />
                <span>+216 XX XXX XXX</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-primary" />
                <span>contact@sevigotn.com</span>
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-foreground">Popular Services</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-primary/30 mr-3 group-hover:bg-primary transition-colors"></span>
                  Plumbing
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-primary/30 mr-3 group-hover:bg-primary transition-colors"></span>
                  Electrical Work
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-primary/30 mr-3 group-hover:bg-primary transition-colors"></span>
                  Carpentry
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-primary/30 mr-3 group-hover:bg-primary transition-colors"></span>
                  House Cleaning
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-primary/30 mr-3 group-hover:bg-primary transition-colors"></span>
                  View All Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-secondary/30 mr-3 group-hover:bg-secondary transition-colors"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-secondary/30 mr-3 group-hover:bg-secondary transition-colors"></span>
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-secondary/30 mr-3 group-hover:bg-secondary transition-colors"></span>
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-secondary/30 mr-3 group-hover:bg-secondary transition-colors"></span>
                  Support
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-2 h-2 rounded-full bg-secondary/30 mr-3 group-hover:bg-secondary transition-colors"></span>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <p className="text-muted-foreground">
              &copy; {new Date().getFullYear()} SeviGOTN. All rights reserved.
            </p>
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Proudly Tunisian</span>
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjRTMxQjIzIiBkPSJNMCAwaDUxMnY1MTJIMHoiLz48Y2lyY2xlIGZpbGw9IiNGRkYiIGN4PSIyNTYiIGN5PSIyNTYiIHI9Ijc2LjAzIi8+PGNpcmNsZSBmaWxsPSIjRTMxQjIzIiBjeD0iMjU2IiBjeT0iMjU2IiByPSI2MC44MiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Im0yODMuNTkgMjM3LjI1LTE0LjkxIDQ2LjA3IDM5LjEyLTI4LjQyaC00OC40bDM5LjEyIDI4LjQyeiIvPjwvc3ZnPg=="
              alt="Tunisia Flag"
              className="w-6 h-6 rounded"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
