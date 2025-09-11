import { useState } from "react";
import { Link } from "react-router-dom";
import { AuroraHero } from "../components/AuroraHero";
import ServiceCard from "../components/ServiceCard";
import TunisianStates from "../components/TunisianStates";
import LazyImage from "../components/LazyImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useServices } from "@/hooks/useServices";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Clock, Star, Shield } from "lucide-react";

const Index = () => {
  const { services, loading } = useServices();
  const { t } = useLanguage();

  const [testimonials] = useState([
    {
      id: "1",
      name: "Ahmed Ben Ali",
      role: "Homeowner",
      content: "ServiGo saved me during a major plumbing emergency. The plumber arrived within an hour and fixed the issue efficiently. The transparent pricing was a plus!",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
    },
    {
      id: "2", 
      name: "Leila Mansouri",
      role: "Apartment Tenant",
      content: "I've used ServiGo multiple times for electrical work. The professionals are always polite, skilled, and clean up after themselves. Highly recommended!",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 4,
    },
    {
      id: "3",
      name: "Karim Bouazizi",
      role: "Business Owner", 
      content: "As a cafe owner, I need reliable services for my business. ServiGo has been my go-to for all maintenance needs. The quality of service is exceptional.",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      rating: 5,
    },
  ]);

  const [professionals] = useState([
    {
      id: "1",
      name: "Youssef Trabelsi",
      title: "Master Plumber",
      image: "https://randomuser.me/api/portraits/men/12.jpg",
      jobs: 124,
      rating: 4.9,
    },
    {
      id: "2",
      name: "Sami Mejri",
      title: "Electrician",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      jobs: 98,
      rating: 4.8,
    },
    {
      id: "3",
      name: "Nadia Belhaj",
      title: "Carpenter",
      image: "https://randomuser.me/api/portraits/women/29.jpg",
      jobs: 87,
      rating: 4.7,
    },
  ]);

  return (
    <main className="flex flex-col min-h-screen">
      <AuroraHero />

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">500+</h3>
              <p className="text-muted-foreground">Professionals</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">24/7</h3>
              <p className="text-muted-foreground">Available</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Star className="h-8 w-8 text-accent" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">4.9</h3>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-servigo-primary/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-servigo-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">100%</h3>
              <p className="text-muted-foreground">Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-20 bg-muted/20" aria-labelledby="popular-services-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              {t('popularServices')}
            </Badge>
            <h2 id="popular-services-heading" className="text-4xl font-bold text-foreground mb-4">
              {t('popularServicesSubtitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos professionnels les plus demandés, disponibles dans toute la Tunisie
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{t('sameDayService')}</span>
              </div>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{t('loadingServices')}</p>
              </div>
            ) : services.length > 0 ? (
            services.slice(0, 6).map((service, index) => {
                console.log("Service provider data:", service.service_providers);
                
                return (
                  <div key={service.id} className="animate-fade-in hover-scale" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ServiceCard
                      id={service.service_providers?.id || service.id}
                      title={service.profiles ? 
                        `${service.profiles.first_name} ${service.profiles.last_name}` : 
                        service.business_name}
                      description={service.description}
                      category={service.job_categories?.name}
                      location={service.location}
                      rating={service.service_providers?.rating}
                      profilePhoto={service.profiles?.profile_photo_url || service.service_providers?.profile_photo_url}
                      servicePhoto={service.servicePhoto}
                      price={service.hourly_rate ? `${service.hourly_rate} TND/hr` : undefined}
                      businessName={service.business_name}
                      serviceType={(service as any).service_type || 'onsite'}
                    />
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">{t('noServicesAvailable')}</p>
              </div>
            )}
          </div>
          
          {/* Online Experts & Freelancers Subsection */}  
          <div className="mt-20 pt-16 border-t border-border/50">
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Badge variant="outline" className="mb-6 bg-card">
                  {t('onlineExperts')}
                </Badge>
                <h3 className="text-3xl font-bold text-foreground mb-4">{t('onlineExpertsSubtitle')}</h3>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed text-lg mb-8">
                  Looking for help with your next digital project? We connect you with skilled online professionals like web developers, graphic designers, marketers, writers, and more. Whether you need help building a website, creating content, or designing graphics, our freelancers are ready to work remotely and bring your vision to life.
                </p>
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-3">
                  {t('browseFreelancers')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link to="/services">
              <Button size="lg" variant="outline" className="px-8 py-3">
                {t('viewAllServices')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              {t('howItWorks')}
            </Badge>
            <h2 id="how-it-works-heading" className="text-4xl font-bold text-foreground mb-4">
              {t('howItWorksSubtitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Réservez un professionnel en quelques clics seulement
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group animate-fade-in">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <div className="hidden md:block absolute top-12 left-full w-full border-t-2 border-dashed border-border -z-10"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('step1Title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('step1Description')}
              </p>
            </div>
            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-secondary to-accent flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <div className="hidden md:block absolute top-12 left-full w-full border-t-2 border-dashed border-border -z-10"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('step2Title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('step2Description')}
              </p>
            </div>
            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-accent to-servigo-primary flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-foreground">{t('step3Title')}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('step3Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas - Tunisian States */}
      <TunisianStates />

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              {t('testimonials')}
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">{t('testimonialsSubtitle')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez ce que nos clients disent de notre service
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.id} className="hover-scale animate-fade-in border-0 shadow-lg" style={{ animationDelay: `${index * 0.2}s` }}>
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= testimonial.rating ? "text-yellow-400 fill-current" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground italic mb-6 text-lg leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center">
                    <LazyImage
                      src={testimonial.image}
                      alt={`${testimonial.name} - Customer photo`}
                      className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-border"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground text-lg">{testimonial.name}</h4>
                      <p className="text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary via-secondary to-accent text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              {t('readyToStart')}
            </Badge>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              {t('readyToStartSubtitle')}
            </h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90 leading-relaxed">
              Rejoignez des milliers d'utilisateurs satisfaits et trouvez le professionnel parfait pour tous vos besoins
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <Link to="/booking">
                <Button size="lg" variant="secondary" className="text-lg px-10 py-4 bg-white text-primary hover:bg-white/90 shadow-lg">
                  {t('bookNow')}
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-10 py-4 bg-transparent border-white/50 hover:bg-white/10 text-white shadow-lg">
                  {t('joinAsProfessional')}
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full flex items-center border border-white/30">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjRTMxQjIzIiBkPSJNMCAwaDUxMnY1MTJIMHoiLz48Y2lyY2xlIGZpbGw9IiNGRkYiIGN4PSIyNTYiIGN5PSIyNTYiIHI9Ijc2LjAzIi8+PGNpcmNsZSBmaWxsPSIjRTMxQjIzIiBjeD0iMjU2IiBjeT0iMjU2IiByPSI2MC44MiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Im0yODMuNTkgMjM3LjI1LTE0LjkxIDQ2LjA3IDM5LjEyLTI4LjQyaC00OC40bDM5LjEyIDI4LjQyeiIvPjwvc3ZnPg=="
                  alt="Tunisia Flag"
                  className="w-6 h-6 mr-3"
                />
                <span className="font-medium">{t('tunisianOwned')}</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="font-medium">{t('paymentMethods')} <span className="font-bold">فلوسي</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
