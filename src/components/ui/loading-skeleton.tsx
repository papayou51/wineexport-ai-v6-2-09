import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "table" | "form" | "analysis" | "project";
  count?: number;
  className?: string;
}

const CardSkeleton = () => (
  <Card className="p-6 space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </Card>
);

const ListItemSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b">
    <Skeleton className="h-8 w-8 rounded" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-6 w-16" />
  </div>
);

const TableRowSkeleton = () => (
  <tr className="border-b">
    <td className="p-4"><Skeleton className="h-4 w-full" /></td>
    <td className="p-4"><Skeleton className="h-4 w-full" /></td>
    <td className="p-4"><Skeleton className="h-4 w-full" /></td>
    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
  </tr>
);

const FormSkeleton = () => (
  <Card className="p-6 space-y-6">
    <Skeleton className="h-8 w-1/3" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </Card>
);

const AnalysisSkeleton = () => (
  <Card className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
    
    <div className="flex gap-2">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-24" />
    </div>
  </Card>
);

const ProjectSkeleton = () => (
  <Card className="p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
    
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-6 w-16" />
      ))}
    </div>
    
    <div className="flex justify-between items-center pt-2 border-t">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  </Card>
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = "card",
  count = 3,
  className,
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return <CardSkeleton />;
      case "list":
        return <ListItemSkeleton />;
      case "table":
        return <TableRowSkeleton />;
      case "form":
        return <FormSkeleton />;
      case "analysis":
        return <AnalysisSkeleton />;
      case "project":
        return <ProjectSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  if (variant === "table") {
    return (
      <div className={cn("w-full", className)}>
        <table className="w-full">
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <React.Fragment key={i}>
                {renderSkeleton()}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("w-full", className)}>
        {renderSkeleton()}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </div>
  );
};