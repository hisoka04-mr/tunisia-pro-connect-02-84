
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PremiumListings = () => {
  const premiumProviders = [
    {
      id: "p1",
      name: "Ahmed Trabelsi",
      profession: "Master Plumber",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4.9,
      premium: true,
      price: "50-90 TND",
      featured: true
    },
    {
      id: "p2",
      name: "Leila Ben Salah",
      profession: "Senior Electrician",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      rating: 4.8,
      premium: true,
      price: "60-120 TND",
      featured: false
    },
    {
      id: "p3",
      name: "Karim Mejri",
      profession: "Expert Carpenter",
      image: "https://randomuser.me/api/portraits/men/78.jpg",
      rating: 4.9,
      premium: true,
      price: "70-150 TND",
      featured: false
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-servigo-light to-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-servigo-dark">Premium Professionals</h2>
          <Link to="/services">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {premiumProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden h-full flex flex-col">
              <div className="relative">
                <img 
                  src={provider.image} 
                  alt={provider.name} 
                  className="w-full h-48 object-cover"
                />
                {provider.featured && (
                  <Badge className="absolute top-2 right-2 bg-yellow-400 text-black font-semibold">
                    FEATURED
                  </Badge>
                )}
                <Badge className="absolute top-2 left-2 bg-servigo-primary">
                  PREMIUM
                </Badge>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-servigo-primary">{provider.profession}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1 font-bold">{provider.rating}</span>
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-2">Starting at <span className="font-bold text-lg">{provider.price}</span></p>
                <p className="text-green-600 font-semibold">✓ Same-day service available</p>
              </CardContent>
              <CardFooter>
                <Link to={`/provider/${provider.id}`} className="w-full">
                  <Button className="w-full">Book Now</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumListings;
