import { supabase } from "@/integrations/supabase/client";

export const removeMedicalCategories = async () => {
  try {
    // Delete medical categories by name patterns
    const { error } = await supabase
      .from('job_categories')
      .delete()
      .ilike('name', '%medic%');

    if (error) {
      console.error('Error removing medical categories:', error);
      return false;
    }

    console.log('Medical categories removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing medical categories:', error);
    return false;
  }
};