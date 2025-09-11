import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface ServiceOwnershipGuardProps {
  children: ReactNode;
  serviceProviderId: string;
  fallback?: ReactNode;
}

export const ServiceOwnershipGuard = ({ 
  children, 
  serviceProviderId, 
  fallback 
}: ServiceOwnershipGuardProps) => {
  const { checkEditOwnServices, isAdmin } = usePermissions();

  // Admins can access everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if user owns this service
  if (checkEditOwnServices(serviceProviderId)) {
    return <>{children}</>;
  }

  // Show fallback or nothing
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="text-center py-4">
      <p className="text-muted-foreground">
        You don't have permission to access this service.
      </p>
    </div>
  );
};