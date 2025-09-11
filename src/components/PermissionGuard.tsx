import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

interface PermissionGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  requireAuth?: boolean;
  showUnauthorized?: boolean;
}

export const PermissionGuard = ({ 
  children, 
  allowedRoles, 
  fallbackPath = "/", 
  requireAuth = true,
  showUnauthorized = false 
}: PermissionGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Show loading while checking auth and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user role is allowed
  if (requireAuth && !allowedRoles.includes(role)) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Required role: {allowedRoles.join(" or ")}
            </p>
            <p className="text-sm text-muted-foreground">
              Your role: {role || "none"}
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};