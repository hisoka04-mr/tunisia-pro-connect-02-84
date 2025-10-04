
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { LogOut, User, Menu, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatNotificationBadge } from "@/components/chat/ChatNotificationBadge";
import ProfilePhotoUpload from "@/components/ProfilePhotoUpload";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";


const Navbar = () => {
  const { user, signOut } = useAuth();
  const { userProfile, isServiceProvider, isAdmin } = useUserRole();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const logout = async () => {
    try {
      await signOut();
      
      toast({
        title: t('success'),
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      
      toast({
        title: t('error'),
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const NavItems = ({ isMobile = false }) => (
    <>
      <Link 
        to="/" 
        className={`relative group font-medium transition-all duration-300 ${
          isMobile 
            ? 'text-lg py-2 hover:text-primary' 
            : 'text-sm hover:text-primary hover:translate-y-[-2px]'
        }`}
      >
        <span className="relative z-10">{t('home')}</span>
        {!isMobile && (
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></div>
        )}
      </Link>
      <Link 
        to="/services" 
        className={`relative group font-medium transition-all duration-300 ${
          isMobile 
            ? 'text-lg py-2 hover:text-primary' 
            : 'text-sm hover:text-primary hover:translate-y-[-2px]'
        }`}
      >
        <span className="relative z-10">{t('services')}</span>
        {!isMobile && (
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></div>
        )}
      </Link>
      <Link 
        to="/pricing" 
        className={`relative group font-medium transition-all duration-300 ${
          isMobile 
            ? 'text-lg py-2 hover:text-primary' 
            : 'text-sm hover:text-primary hover:translate-y-[-2px]'
        }`}
      >
        <span className="relative z-10">{t('pricing')}</span>
        {!isMobile && (
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></div>
        )}
      </Link>
      <Link 
        to="/contact" 
        className={`relative group font-medium transition-all duration-300 ${
          isMobile 
            ? 'text-lg py-2 hover:text-primary' 
            : 'text-sm hover:text-primary hover:translate-y-[-2px]'
        }`}
      >
        <span className="relative z-10">{t('contact')}</span>
        {!isMobile && (
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></div>
        )}
      </Link>
      {user && (
        <Link 
          to="/bookings" 
          className={`relative group font-medium transition-all duration-300 ${
            isMobile 
              ? 'text-lg py-2 hover:text-primary' 
              : 'text-sm hover:text-primary hover:translate-y-[-2px]'
          }`}
        >
          <span className="relative z-10">{t('bookings')}</span>
          {!isMobile && (
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></div>
          )}
        </Link>
      )}
      {user && isAdmin && (
        <Link 
          to="/admin-dashboard" 
          className={`relative group font-medium transition-all duration-300 ${
            isMobile 
              ? 'text-lg py-2 hover:text-primary flex items-center gap-2' 
              : 'text-sm hover:text-primary hover:translate-y-[-2px] flex items-center gap-2'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="relative z-10">{t('admin')}</span>
          {!isMobile && (
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></div>
          )}
        </Link>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <span className="font-bold text-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                ServiGO
              </span>
              <span className="font-bold text-2xl text-foreground/80 transition-all duration-300 group-hover:text-foreground">
                TN
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <NavItems />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <LanguageSwitcher />
            
            {user && (
              <div className="flex items-center space-x-2">
                <ChatNotificationBadge />
                <NotificationCenter />
              </div>
            )}

            {!user ? (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="font-medium hover:bg-muted/50 transition-all duration-200"
                  >
                    {t('login')}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    size="sm"
                    className="font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {t('register')}
                  </Button>
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200 hover:scale-105"
                  >
                    <ProfilePhotoUpload 
                      currentPhotoUrl={userProfile?.profile_photo_url}
                      userFirstName={userProfile?.first_name}
                      userLastName={userProfile?.last_name}
                      size="sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 p-2 bg-background/95 backdrop-blur-lg border border-border/50" 
                  align="end"
                  sideOffset={8}
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <ProfilePhotoUpload 
                      currentPhotoUrl={userProfile?.profile_photo_url}
                      userFirstName={userProfile?.first_name}
                      userLastName={userProfile?.last_name}
                      size="md"
                    />
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-sm leading-none">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none">
                        {user?.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {userProfile?.role}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{t('profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center gap-2 p-2 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center space-x-2">
            <LanguageSwitcher />
            
            {user && (
              <div className="flex items-center space-x-1">
                <ChatNotificationBadge />
                <NotificationCenter />
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 hover:bg-muted/50 transition-all duration-200"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[280px] bg-background/95 backdrop-blur-lg border-l border-border/50"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center gap-3 py-4 border-b border-border/50">
                    <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      ServiGO<span className="text-foreground/80">TN</span>
                    </span>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-1 py-4 flex-1">
                    <NavItems isMobile={true} />
                  </nav>

                  {/* Mobile User Section */}
                  <div className="border-t border-border/50 pt-4">
                    {!user ? (
                      <div className="flex flex-col space-y-2">
                        <Link to="/auth">
                          <Button variant="outline" className="w-full justify-start">
                            {t('loginRegister')}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <ProfilePhotoUpload 
                            currentPhotoUrl={userProfile?.profile_photo_url}
                            userFirstName={userProfile?.first_name}
                            userLastName={userProfile?.last_name}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {userProfile?.first_name} {userProfile?.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {userProfile?.role}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Link to="/profile">
                            <Button variant="ghost" className="w-full justify-start gap-2">
                              <User className="h-4 w-4" />
                              {t('profile')}
                            </Button>
                          </Link>
                          <Button 
                            onClick={logout} 
                            variant="ghost"
                            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <LogOut className="h-4 w-4" />
                            {t('logout')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
