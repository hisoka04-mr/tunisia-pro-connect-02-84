import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, Users, Headphones, BarChart3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const plans = [
    {
      name: "Pro",
      nameAr: "محترف",
      price: "29",
      period: "DT/mois",
      periodAr: "د.ت/شهر",
      description: "Pour les besoins réguliers",
      descriptionAr: "للاحتياجات المنتظمة",
      icon: <Zap className="w-8 h-8" />,
      gradient: "from-blue-500 via-purple-500 to-pink-500",
      features: [
        { fr: "Demandes illimitées", ar: "طلبات غير محدودة", icon: <Star className="w-4 h-4" /> },
        { fr: "Priorité dans les résultats", ar: "أولوية في النتائج", icon: <Sparkles className="w-4 h-4" /> },
        { fr: "Support prioritaire", ar: "دعم ذو أولوية", icon: <Headphones className="w-4 h-4" /> },
        { fr: "Statistiques détaillées", ar: "إحصائيات مفصلة", icon: <BarChart3 className="w-4 h-4" /> }
      ],
      popular: true
    },
    {
      name: "Entreprise",
      nameAr: "مؤسسة",
      price: "99",
      period: "DT/mois",
      periodAr: "د.ت/شهر",
      description: "Pour les grandes équipes",
      descriptionAr: "للفرق الكبيرة",
      icon: <Shield className="w-8 h-8" />,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      features: [
        { fr: "Tout du plan Pro", ar: "كل ما في الخطة الاحترافية", icon: <Check className="w-4 h-4" /> },
        { fr: "Gestion d'équipe", ar: "إدارة الفريق", icon: <Users className="w-4 h-4" /> },
        { fr: "API dédiée", ar: "واجهة برمجة مخصصة", icon: <Zap className="w-4 h-4" /> },
        { fr: "Support 24/7", ar: "دعم 24/7", icon: <Headphones className="w-4 h-4" /> },
        { fr: "Formation personnalisée", ar: "تدريب مخصص", icon: <Star className="w-4 h-4" /> }
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2" />
            Offres Spéciales Disponibles
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
            Tarifs Simples
            <br />
            <span className="text-primary">& Transparents</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choisissez le plan parfait pour faire grandir votre activité avec des outils professionnels
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`group relative overflow-hidden border-0 shadow-2xl transition-all duration-500 hover:scale-105 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-primary/5 via-background to-accent/5 ring-2 ring-primary/50 shadow-primary/25' 
                  : 'bg-gradient-to-br from-background to-muted/50 hover:shadow-xl'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-2 text-sm font-bold transform rotate-12 translate-x-4 -translate-y-1 shadow-lg">
                  POPULAIRE
                </div>
              )}

              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              <CardHeader className="relative text-center pb-8 pt-12">
                {/* Plan icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {plan.icon}
                </div>
                
                <CardTitle className="text-3xl font-bold mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-lg">{plan.description}</CardDescription>
                
                {/* Price */}
                <div className="flex items-baseline justify-center mt-6 mb-4">
                  <span className={`text-6xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2 text-lg">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="relative">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center group/item">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${plan.gradient} text-white mr-4 group-hover/item:scale-110 transition-transform duration-200`}>
                        {feature.icon}
                      </div>
                      <span className="text-foreground font-medium group-hover/item:text-primary transition-colors duration-200">
                        {feature.fr}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full h-14 text-lg font-semibold shadow-lg transition-all duration-300 ${
                    plan.popular 
                      ? `bg-gradient-to-r ${plan.gradient} hover:shadow-xl hover:scale-105 text-white border-0` 
                      : 'hover:scale-105'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.popular ? 'Commencer Maintenant' : 'Choisir ce Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20 shadow-xl">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Besoin d'aide pour choisir ?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Notre équipe d'experts est là pour vous accompagner et vous aider à trouver la solution parfaite pour vos besoins
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate('/contact')}
                  className="h-14 px-8 text-lg border-primary/50 hover:bg-primary/10 hover:scale-105 transition-all duration-300"
                >
                  <Headphones className="w-5 h-5 mr-2" />
                  Parler à un Expert
                </Button>
                <Button 
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Essai Gratuit 14 Jours
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;