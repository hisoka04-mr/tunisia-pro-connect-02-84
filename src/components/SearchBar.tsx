
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (serviceType) params.set('service', serviceType);
    
    navigate(`/services?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger>
            <SelectValue placeholder="What service do you need?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Carpenter">Carpentry</SelectItem>
            <SelectItem value="Electrician">Electrical</SelectItem>
            <SelectItem value="Cleaner">House Cleaning</SelectItem>
            <SelectItem value="Painter">Painting</SelectItem>
            <SelectItem value="Plumber">Plumbing</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ariana">Ariana</SelectItem>
            <SelectItem value="Ben Arous">Ben Arous</SelectItem>
            <SelectItem value="Béja">Béja</SelectItem>
            <SelectItem value="Bizerte">Bizerte</SelectItem>
            <SelectItem value="Gabès">Gabès</SelectItem>
            <SelectItem value="Gafsa">Gafsa</SelectItem>
            <SelectItem value="Jendouba">Jendouba</SelectItem>
            <SelectItem value="Kairouan">Kairouan</SelectItem>
            <SelectItem value="Kasserine">Kasserine</SelectItem>
            <SelectItem value="Kebili">Kebili</SelectItem>
            <SelectItem value="Kef">Kef</SelectItem>
            <SelectItem value="Mahdia">Mahdia</SelectItem>
            <SelectItem value="Manouba">Manouba</SelectItem>
            <SelectItem value="Medenine">Medenine</SelectItem>
            <SelectItem value="Monastir">Monastir</SelectItem>
            <SelectItem value="Nabeul">Nabeul</SelectItem>
            <SelectItem value="Sfax">Sfax</SelectItem>
            <SelectItem value="Sidi Bouzid">Sidi Bouzid</SelectItem>
            <SelectItem value="Siliana">Siliana</SelectItem>
            <SelectItem value="Sousse">Sousse</SelectItem>
            <SelectItem value="Tataouine">Tataouine</SelectItem>
            <SelectItem value="Tozeur">Tozeur</SelectItem>
            <SelectItem value="Tunis">Tunis</SelectItem>
            <SelectItem value="Zaghouan">Zaghouan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSearch} className="whitespace-nowrap">
        Find Services
      </Button>
    </div>
  );
};

export default SearchBar;
