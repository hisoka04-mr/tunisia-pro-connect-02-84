
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/useUserRole";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ServiceListings from "./pages/ServiceListings";
import ServiceDetail from "./pages/ServiceDetail";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import BookingForm from "./pages/BookingForm";

import ServiceProviderDetails from "./pages/ServiceProviderDetails";
import AdminDashboard from "./pages/AdminDashboard";
import DatabaseManagement from "./pages/DatabaseManagement";
import Chat from "./pages/Chat";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import SmartBookingForm from "./pages/SmartBookingForm";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PermissionGuard } from "./components/PermissionGuard";
import { ChatHeader } from "./components/chat/ChatHeader";
import { BookingStatusManager } from "./components/BookingStatusManager";
import { NotificationProvider } from "./components/NotificationProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <UserRoleProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <ChatHeader />
            <main className="pt-16 min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={
                  <ProtectedRoute requireAuth={false}>
                    <Auth />
                  </ProtectedRoute>
                } />
                <Route path="/services" element={<ServiceListings />} />
                <Route path="/service/:serviceId" element={<ServiceDetail />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/booking" element={
                  <ProtectedRoute>
                    <BookingForm />
                  </ProtectedRoute>
                } />
                <Route path="/booking-form" element={
                  <ProtectedRoute>
                    <BookingForm />
                  </ProtectedRoute>
                } />
                <Route path="/booking/:providerId" element={
                  <ProtectedRoute>
                    <SmartBookingForm />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={
                  <PermissionGuard allowedRoles={["admin"]} showUnauthorized={true}>
                    <AdminDashboard />
                  </PermissionGuard>
                } />
                <Route path="/database-management" element={
                  <PermissionGuard allowedRoles={["admin"]} showUnauthorized={true}>
                    <DatabaseManagement />
                  </PermissionGuard>
                } />
                <Route path="/provider/:providerId" element={<ServiceProviderDetails />} />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/bookings" element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <BookingStatusManager />
            <NotificationProvider />
            <Footer />
        </BrowserRouter>
          </TooltipProvider>
        </UserRoleProvider>
      </AuthProvider>
    </LanguageProvider>
</QueryClientProvider>
);

export default App;
