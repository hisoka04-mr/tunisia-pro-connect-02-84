// Simple connection test utility
import { supabase } from "@/integrations/supabase/client";

export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");
    
    // Test basic connection
    const { data, error } = await supabase
      .from("services")
      .select("count", { count: "exact", head: true });
    
    if (error) {
      console.error("Database connection test failed:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Database connection successful. Services count:", data);
    return { success: true, count: data };
    
  } catch (error) {
    console.error("Database connection test error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const testJobCategoriesAccess = async () => {
  try {
    console.log("Testing job categories access...");
    
    const { data, error } = await supabase
      .from("job_categories")
      .select("id, name")
      .limit(5);
    
    if (error) {
      console.error("Job categories access test failed:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Job categories access successful:", data?.length || 0, "categories found");
    return { success: true, data };
    
  } catch (error) {
    console.error("Job categories access test error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};