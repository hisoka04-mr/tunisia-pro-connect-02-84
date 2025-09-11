import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { seedJobCategories } from "@/utils/seedJobCategories";
import { migrateCategoryServiceTypes } from "@/utils/migrateCategoryServiceTypes";

export const SeedJobCategories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const handleSeedCategories = async () => {
    setIsLoading(true);
    try {
      const result = await seedJobCategories();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.count 
            ? `Added ${result.count} new service categories successfully!`
            : result.message || "Job categories updated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add service categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateCategoryServiceTypes();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Categories migrated successfully!",
        });
      } else if (result.requiresMigration) {
        toast({
          title: "Database Migration Required",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to migrate categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during migration",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Manage Service Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will add all standardized service categories to the database. Categories are organized into logical groups like Home & Construction, Beauty & Wellness, Professional Services, etc. Only new categories will be added to avoid duplicates.
        </p>
        <Button 
          onClick={handleSeedCategories}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Adding Categories..." : "Add Service Categories"}
        </Button>
      </div>
      
      <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-amber-800">Fix Service Type Categories</h3>
        <p className="text-sm text-amber-700 mb-4">
          This will update existing categories to properly separate onsite and online services. Run this if you're seeing the same categories for both service types.
        </p>
        <Button 
          onClick={handleMigration}
          disabled={isMigrating}
          className="w-full"
          variant="outline"
        >
          {isMigrating ? "Migrating Categories..." : "Fix Category Service Types"}
        </Button>
      </div>
    </div>
  );
};