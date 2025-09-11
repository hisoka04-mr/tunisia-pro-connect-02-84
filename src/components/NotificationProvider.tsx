import { useNotifications } from "@/hooks/useNotifications";

export const NotificationProvider = () => {
  // This component initializes the notification system and real-time subscriptions
  useNotifications();
  return null;
};