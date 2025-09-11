import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  ChevronRight, 
  Layers,
  Table2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableData {
  id: string;
  name: string;
  type: string;
  records?: number;
  status: "active" | "inactive" | "pending";
  lastModified: string;
  description?: string;
}

interface ModernDataTableProps {
  data: TableData[];
  title?: string;
  onTableSelect?: (tableId: string) => void;
}

const ModernDataTable: React.FC<ModernDataTableProps> = ({ 
  data, 
  title = "Database Tables",
  onTableSelect 
}) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-50 text-green-700 border-green-200",
      inactive: "bg-gray-50 text-gray-700 border-gray-200", 
      pending: "bg-amber-50 text-amber-700 border-amber-200"
    };
    
    return (
      <Badge 
        variant="outline" 
        className={variants[status as keyof typeof variants]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {data.length} tables available
            </p>
          </div>
        </div>
      </div>

      {/* Modern Table Grid */}
      <div className="grid gap-3">
        {data.map((table, index) => (
          <Card 
            key={table.id}
            className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/20"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                      <Table2 className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {table.name}
                      </h3>
                      {getStatusBadge(table.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {table.type}
                      </span>
                      {table.records && (
                        <span>{table.records.toLocaleString()} records</span>
                      )}
                      <span>Updated {table.lastModified}</span>
                    </div>
                    
                    {table.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {table.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTableSelect?.(table.id)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  >
                    View Table
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Database className="h-4 w-4 mr-2" />
                        View Schema
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Layers className="h-4 w-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No tables found</h3>
            <p className="text-muted-foreground">
              There are no database tables to display at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernDataTable;