import { supabase } from "@/integrations/supabase/client";

export const migrateCategoryServiceTypes = async () => {
  try {
    // First, try to add the service_type column if it doesn't exist
    console.log("Checking if service_type column exists...");
    
    // Check if service_type column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from("job_categories")
      .select("service_type")
      .limit(1);
    
    let columnExists = !testError;
    
    if (!columnExists) {
      console.log("service_type column doesn't exist, need to add it via SQL migration");
      return {
        success: false,
        message: "Database schema update required. Please run the SQL migration: supabase/add-service-type-to-categories.sql",
        requiresMigration: true
      };
    }
    
    console.log("service_type column exists, proceeding with data migration...");
    
    // Get all categories
    const { data: categories, error: fetchError } = await supabase
      .from("job_categories")
      .select("*");
    
    if (fetchError) throw fetchError;
    
    // Define which categories should be online
    const onlineCategories = [
      'Tutoring', 'Web Design', 'Graphic Design', 'Content Creation', 
      'Social Media Management', 'SEO Services', 'Writing Services', 
      'Translation Services', 'IT Support', 'Data Entry', 'Virtual Assistant', 
      'Accounting', 'Bookkeeping', 'Tax Preparation', 'Financial Planning',
      'Legal Services', 'Insurance Services', 'Nutritionist', 'Life Coach',
      'Language Tutoring'
    ];
    
    let updateCount = 0;
    
    // Update categories to have correct service types
    for (const category of categories || []) {
      const shouldBeOnline = onlineCategories.includes(category.name);
      const targetServiceType = shouldBeOnline ? 'online' : 'onsite';
      
      // Only update if current value is different or null
      const currentServiceType = (category as any).service_type;
      if (currentServiceType !== targetServiceType) {
        const { error: updateError } = await supabase
          .from("job_categories")
          .update({ service_type: targetServiceType } as any)
          .eq("id", category.id);
        
        if (updateError) {
          console.error(`Failed to update category ${category.name}:`, updateError);
        } else {
          updateCount++;
          console.log(`Updated ${category.name} to ${targetServiceType}`);
        }
      }
    }
    
    return {
      success: true,
      message: `Successfully updated ${updateCount} categories with service types`,
      updateCount
    };
    
  } catch (error) {
    console.error("Error in migrateCategoryServiceTypes:", error);
    return {
      success: false,
      error: error,
      message: "Failed to migrate category service types"
    };
  }
};