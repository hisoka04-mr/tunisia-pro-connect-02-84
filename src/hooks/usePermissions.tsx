import { useUserRole } from "./useUserRole";

export const usePermissions = () => {
  const { userProfile, role, isAdmin, isServiceProvider, isClient, checkServiceOwnership } = useUserRole();

  const checkEditOwnServices = (serviceProviderId: string) => isServiceProvider && checkServiceOwnership(serviceProviderId);
  const checkDeleteOwnServices = (serviceProviderId: string) => isServiceProvider && checkServiceOwnership(serviceProviderId);
  const checkUpdateBookingStatus = (serviceProviderId: string) => isServiceProvider && checkServiceOwnership(serviceProviderId);

  const permissions = {
    // Admin permissions
    canAccessAdminDashboard: isAdmin,
    canManageUsers: isAdmin,
    canManageAllServices: isAdmin,
    canApproveServiceProviders: isAdmin,
    canViewAllBookings: isAdmin,
    canManagePayments: isAdmin,

    // Service Provider permissions - Allow any authenticated user to post services
    canCreateServices: Boolean(userProfile), // Allow any authenticated user to post services
    canViewOwnBookings: isServiceProvider,
    canUploadCertificate: isServiceProvider,

    // Client permissions
    canBookServices: isClient || isAdmin,
    canViewClientBookings: isClient || isAdmin,
    canCancelOwnBookings: isClient || isAdmin,
    canLeaveReviews: isClient || isAdmin,
    canViewServices: true, // Public access

    // General permissions
    canEditOwnProfile: Boolean(userProfile),
    canChangePassword: Boolean(userProfile),
    canContactSupport: Boolean(userProfile),
  };

  const hasPermission = (permission: keyof typeof permissions) => {
    const permissionValue = permissions[permission];
    return Boolean(permissionValue);
  };

  return {
    permissions,
    hasPermission,
    checkEditOwnServices,
    checkDeleteOwnServices,
    checkUpdateBookingStatus,
    role,
    userProfile,
    isAdmin,
    isServiceProvider,
    isClient,
  };
};