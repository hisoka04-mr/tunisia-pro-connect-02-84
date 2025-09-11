import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AccountType = 'client' | 'onsite_provider' | 'online_provider';

export const useAccountType = () => {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountType = async () => {
      if (!user) {
        setAccountType('client');
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Error fetching account type:', error);
          setAccountType('client');
        } else {
          setAccountType((profile?.account_type as AccountType) || 'client');
        }
      } catch (error) {
        console.warn('Error in fetchAccountType:', error);
        setAccountType('client');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountType();
  }, [user]);

  const updateAccountType = async (newAccountType: AccountType) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: newAccountType })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating account type:', error);
        return false;
      }

      setAccountType(newAccountType);
      return true;
    } catch (error) {
      console.error('Error in updateAccountType:', error);
      return false;
    }
  };

  return {
    accountType,
    loading,
    updateAccountType
  };
};