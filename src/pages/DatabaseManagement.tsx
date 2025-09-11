import React, { useState } from "react";
import ModernDataTable from "@/components/ModernDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

// Sample data - replace with your actual data
const sampleTableData = [
  {
    id: "1",
    name: "users",
    type: "Core Table",
    records: 1245,
    status: "active" as const,
    lastModified: "2 hours ago",
    description: "User authentication and profile data"
  },
  {
    id: "2", 
    name: "service_providers",
    type: "Business Table",
    records: 89,
    status: "active" as const,
    lastModified: "1 day ago",
    description: "Service provider information and certifications"
  },
  {
    id: "3",
    name: "bookings",
    type: "Transaction Table", 
    records: 2156,
    status: "active" as const,
    lastModified: "30 minutes ago",
    description: "Appointment and booking records"
  },
  {
    id: "4",
    name: "reviews",
    type: "Content Table",
    records: 456,
    status: "active" as const,
    lastModified: "5 hours ago",
    description: "Customer reviews and ratings"
  },
  {
    id: "5",
    name: "messages",
    type: "Communication Table",
    records: 3421,
    status: "active" as const,
    lastModified: "15 minutes ago",
    description: "Chat messages and notifications"
  },
  {
    id: "6",
    name: "job_categories",
    type: "Reference Table",
    records: 45,
    status: "active" as const,
    lastModified: "1 week ago",
    description: "Service categories and classifications"
  },
  {
    id: "7",
    name: "services",
    type: "Business Table",
    records: 234,
    status: "active" as const,
    lastModified: "3 hours ago",
    description: "Available services and pricing"
  },
  {
    id: "8",
    name: "notifications",
    type: "System Table",
    records: 12430,
    status: "active" as const,
    lastModified: "5 minutes ago",
    description: "System and user notifications"
  }
];

const DatabaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(sampleTableData);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = sampleTableData.filter(table =>
      table.name.toLowerCase().includes(query.toLowerCase()) ||
      table.type.toLowerCase().includes(query.toLowerCase()) ||
      table.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleTableSelect = (tableId: string) => {
    const table = sampleTableData.find(t => t.id === tableId);
    console.log("Selected table:", table);
    // Add your table selection logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Database Management
          </h1>
          <p className="text-muted-foreground">
            Manage and explore your database tables with modern interface
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Table
            </Button>
          </div>
        </div>

        {/* Modern Data Table */}
        <ModernDataTable 
          data={filteredData}
          title="Database Tables"
          onTableSelect={handleTableSelect}
        />
      </div>
    </div>
  );
};

export default DatabaseManagement;