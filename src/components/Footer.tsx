
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-servigo-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">SeviGOTN</h3>
            <p className="text-gray-300 mb-4">
              Your trusted marketplace for home services in Tunisia.
              Book professionals with just one click.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/services" className="text-gray-300 hover:text-white transition-colors">Plumbing</Link></li>
              <li><Link to="/services" className="text-gray-300 hover:text-white transition-colors">Electrical Work</Link></li>
              <li><Link to="/services" className="text-gray-300 hover:text-white transition-colors">Carpentry</Link></li>
              <li><Link to="/services" className="text-gray-300 hover:text-white transition-colors">House Cleaning</Link></li>
              <li><Link to="/services" className="text-gray-300 hover:text-white transition-colors">All Services</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Press</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} SeviGOTN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
