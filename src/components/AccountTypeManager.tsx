import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAccountType, AccountType } from "@/hooks/useAccountType";
import { Wrench, Monitor, User } from "lucide-react";

export const AccountTypeManager = () => {
  const { accountType, updateAccountType } = useAccountType();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleAccountTypeChange = async (newType: AccountType) => {
    if (newType === accountType) return;

    setIsUpdating(true);
    try {
      const success = await updateAccountType(newType);
      if (success) {
        toast({
          title: "Account type updated",
          description: `Your account type has been changed to ${getAccountTypeLabel(newType)}`,
        });
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update account type. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating your account type.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'client':
        return 'Client';
      case 'onsite_provider':
        return 'On-site Service Provider';
      case 'online_provider':
        return 'Online Service Provider';
      default:
        return 'Unknown';
    }
  };

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'client':
        return <User className="h-5 w-5" />;
      case 'onsite_provider':
        return <Wrench className="h-5 w-5" />;
      case 'online_provider':
        return <Monitor className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getAccountTypeDescription = (type: AccountType) => {
    switch (type) {
      case 'client':
        return 'Book services from providers';
      case 'onsite_provider':
        return 'Offer services at client locations';
      case 'online_provider':
        return 'Provide remote digital services';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getAccountTypeIcon(accountType)}
          Account Type
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current type:</span>
          <Badge variant="secondary" className="text-sm">
            {getAccountTypeLabel(accountType)}
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground">
          {getAccountTypeDescription(accountType)}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Change Account Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['client', 'onsite_provider', 'online_provider'] as AccountType[]).map((type) => (
              <div
                key={type}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  accountType === type
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => handleAccountTypeChange(type)}
              >
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    {getAccountTypeIcon(type)}
                  </div>
                  <h5 className="font-medium text-sm mb-1">
                    {getAccountTypeLabel(type)}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {getAccountTypeDescription(type)}
                  </p>
                  {accountType === type && (
                    <Badge variant="default" className="mt-2 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {accountType !== 'client' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> As a service provider, you can post services and receive bookings. 
              You can always change your account type later if you want to offer different types of services.
            </p>
          </div>
        )}

        {isUpdating && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Updating account type...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};