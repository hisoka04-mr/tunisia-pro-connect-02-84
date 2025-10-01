
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const TunisianStates = () => {
  const navigate = useNavigate();
  const states = [
    "Ariana", "Ben Arous", "Béja", "Bizerte", "Gabès", "Gafsa", 
    "Jendouba", "Kairouan", "Kasserine", "Kebili", "Kef", "Mahdia", 
    "Manouba", "Medenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", 
    "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
  ];

  const handleStateClick = (state: string) => {
    navigate(`/services?location=${encodeURIComponent(state)}`);
  };
  
  return (
    <div className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Our Service Coverage</h2>
        <p className="text-center mb-8">ServiGOTN provides professional services across all of Tunisia</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {states.map((state) => (
            <Card 
              key={state} 
              className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg hover:scale-105"
              onClick={() => handleStateClick(state)}
            >
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center">
                  <div className="w-6 h-4 mr-3 rounded-sm overflow-hidden shadow-sm border border-gray-200">
                    <svg
                      viewBox="0 0 512 341"
                      className="w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="512" height="341" fill="#E31B23"/>
                      <circle cx="256" cy="170.5" r="76" fill="white"/>
                      <circle cx="256" cy="170.5" r="60" fill="#E31B23"/>
                      <path
                        d="M283 151l-15 46 39-28h-48l39 28z"
                        fill="white"
                      />
                      <path
                        d="M295 170.5c0 21.5-17.5 39-39 39s-39-17.5-39-39c0-8 2.5-15.5 6.5-21.5 8.5 12 23 20 39 20s30.5-8 39-20c4 6 6.5 13.5 6.5 21.5z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-800">{state}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TunisianStates;
