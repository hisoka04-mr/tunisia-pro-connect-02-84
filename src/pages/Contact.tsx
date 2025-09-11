import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Headphones, Globe, Zap, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would typically send the form data to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Message envoyé avec succès! Nous vous répondrons bientôt.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      info: "aymench01333@gmail.com",
      description: "Réponse sous 24h",
      gradient: "from-blue-500 to-blue-600",
      delay: "delay-0"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Téléphone",
      info: "+216 21852008",
      description: "Lun-Ven 9h-18h",
      gradient: "from-green-500 to-green-600",
      delay: "delay-100"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Adresse",
      info: "Tunis, Tunisie",
      description: "Bureau principal",
      gradient: "from-purple-500 to-purple-600",
      delay: "delay-200"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Horaires",
      info: "Lun-Ven: 9h-18h",
      description: "Support disponible",
      gradient: "from-orange-500 to-orange-600",
      delay: "delay-300"
    }
  ];

  const supportOptions = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Chat en Direct",
      description: "Réponse immédiate",
      action: "Commencer le Chat",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Support Téléphonique",
      description: "Appelez-nous maintenant",
      action: "Appeler",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Centre d'Aide",
      description: "Documentation complète",
      action: "Visiter",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent/5 to-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Heart className="w-4 h-4 mr-2" />
            Nous sommes là pour vous aider
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
            Contactez
            <br />
            <span className="text-primary">Notre Équipe</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Une question ? Un projet ? Notre équipe d'experts est à votre disposition pour vous accompagner
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto mb-20">
          {/* Contact Form */}
          <div className="space-y-8">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-background to-muted/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
              <CardHeader className="relative text-center pb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent text-white mb-6 shadow-lg">
                  <Send className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Envoyez-nous un message
                </CardTitle>
                <CardDescription className="text-lg">
                  Décrivez votre projet et nous vous répondrons rapidement
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">Nom complet *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Votre nom complet"
                        required
                        className="h-12 border-muted-foreground/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="votre@email.com"
                        required
                        className="h-12 border-muted-foreground/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold">Sujet *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Le sujet de votre message"
                      required
                      className="h-12 border-muted-foreground/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-semibold">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre besoin en détail..."
                      rows={6}
                      required
                      className="border-muted-foreground/20 focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Envoyer le Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Info Cards */}
            <div className="grid gap-6">
              {contactInfo.map((item, index) => (
                <Card 
                  key={index} 
                  className={`group border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in ${item.delay} bg-gradient-to-br from-background to-muted/20`}
                >
                  <CardContent className="flex items-center p-6">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} text-white mr-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors duration-200">{item.title}</h3>
                      <p className="text-lg font-semibold mb-1">{item.info}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Support Options */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
              <CardHeader className="relative text-center pb-6">
                <CardTitle className="text-2xl font-bold mb-2">Autres Options de Support</CardTitle>
                <CardDescription>Choisissez le canal qui vous convient le mieux</CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {supportOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full h-16 justify-start text-left p-6 hover:scale-105 transition-all duration-300 border-0 bg-background/50 hover:bg-background/80 shadow-md hover:shadow-lg"
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${option.gradient} text-white mr-4 shadow-md`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <div className="text-primary font-medium">
                      {option.action}
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* WhatsApp Emergency */}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <CardContent className="relative p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 shadow-lg">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Besoin d'aide urgente ?</h3>
                <p className="mb-6 text-white/90">
                  Pour les urgences, contactez-nous directement via WhatsApp pour une réponse immédiate
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-white text-green-600 hover:bg-white/90 font-semibold px-8 h-12 shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Contacter via WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;