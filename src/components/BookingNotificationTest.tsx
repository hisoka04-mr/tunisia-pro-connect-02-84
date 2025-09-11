import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const BookingNotificationTest = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createTestNotification = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to test notifications",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create a test booking notification
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: "🧪 Test: Nouvelle demande de réservation",
          message: "Ceci est un test de notification pour vérifier que le système fonctionne correctement.",
          type: "booking_request",
          is_read: false,
        })
        .select();

      if (error) throw error;

      toast({
        title: "✅ Test notification created",
        description: "Check the notification bell to see the test notification",
      });
    } catch (error: any) {
      console.error("Error creating test notification:", error);
      toast({
        title: "❌ Test failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🧪 Test Notification System</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={createTestNotification}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Create Test Notification"}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          This will create a test booking notification to verify the system works.
        </p>
      </CardContent>
    </Card>
  );
};