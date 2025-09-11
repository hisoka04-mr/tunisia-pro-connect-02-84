
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const MembershipOptions = () => {
  const membershipPlans = [
    {
      id: "premium",
      name: "Premium",
      price: "29 TND",
      period: "per month",
      features: [
        "Priority bookings",
        "10% discount on all services",
        "Same-day service guarantee",
        "Premium customer support"
      ],
      recommended: true,
      buttonText: "Upgrade Now"
    },
    {
      id: "family",
      name: "Family",
      price: "69 TND",
      period: "per month",
      features: [
        "Coverage for up to 4 family members",
        "20% discount on all services",
        "Same-day service guarantee",
        "Emergency support 24/7",
        "Free annual maintenance check-up"
      ],
      recommended: false,
      buttonText: "Choose Plan"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-servigo-dark mb-4">Membership Plans</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the perfect membership plan for your home service needs. Enjoy priority bookings, discounts, and premium support.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {membershipPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`flex flex-col ${plan.recommended ? 'border-servigo-primary border-2 shadow-lg relative' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-servigo-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Recommended
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.id === 'basic' ? 'bg-gray-500' : ''}`} 
                  variant={plan.recommended ? 'default' : 'outline'}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MembershipOptions;
