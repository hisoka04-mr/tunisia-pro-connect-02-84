import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientRegistration } from "@/components/auth/ClientRegistration";
import { ServiceProviderRegistration } from "@/components/auth/ServiceProviderRegistration";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get state from location (when redirected from service provider page)
  const locationState = location.state as {
    tab?: 'login' | 'signup';
    returnTo?: string;
    message?: string;
  } | null;

  const [activeTab, setActiveTab] = useState(locationState?.tab === 'signup' ? 'client' : 'login');

  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      const returnTo = locationState?.returnTo || "/";
      navigate(returnTo);
    }
  }, [user, navigate, locationState]);

  useEffect(() => {
    // Show message if redirected from booking attempt
    if (locationState?.message) {
      toast({
        title: "Authentication Required",
        description: locationState.message,
      });
    }
  }, [locationState?.message, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-servigo-light via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2338BDF8' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
            Welcome to Services
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Connect with trusted service providers in Tunisia
          </p>
        </div>

        {locationState?.message && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              {locationState.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-1">
            <TabsTrigger 
              value="login" 
              className="rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="client"
              className="rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              Client
            </TabsTrigger>
            <TabsTrigger 
              value="provider"
              className="rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/50"
            >
              Provider
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <LoginForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="mt-6">
            <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <div className="text-white text-lg font-bold">C</div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Join as a Client</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Find and book trusted service providers
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ClientRegistration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="provider" className="mt-6">
            <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <div className="text-white text-lg font-bold">P</div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Join as a Service Provider</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Start your business with a free trial month
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ServiceProviderRegistration />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;