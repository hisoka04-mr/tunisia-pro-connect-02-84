import { useUserRole } from "@/hooks/useUserRole";
import { ClientProfileEdit } from "@/components/profile/ClientProfileEdit";
import { ServiceProviderProfileEdit } from "@/components/profile/ServiceProviderProfileEdit";
import { MyServices } from "@/components/MyServices";
import { AccountTypeManager } from "@/components/AccountTypeManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const { userProfile, loading, isServiceProvider, isClient } = useUserRole();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
      </div>

      <div className="space-y-8">
        <AccountTypeManager />
        {isServiceProvider && <MyServices />}
        {isServiceProvider && <ServiceProviderProfileEdit />}
        {isClient && <ClientProfileEdit />}
      </div>
    </div>
  );
};

export default Profile;