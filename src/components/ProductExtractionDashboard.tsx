import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExtractionMonitoringPanel } from "./ExtractionMonitoringPanel";
import { ProductUpload } from "./ProductUpload";
import { ProductData } from "@/hooks/useProducts";
import { useExtractionMonitoring } from "@/hooks/useExtractionMonitoring";
import { BarChart3, Upload, Settings } from "lucide-react";

interface ProductExtractionDashboardProps {
  organizationId: string;
  onDataExtracted: (data: ProductData, extractedText: string, qualityScore?: number) => void;
  showMonitoring?: boolean;
}

export const ProductExtractionDashboard = ({ 
  organizationId, 
  onDataExtracted, 
  showMonitoring = true 
}: ProductExtractionDashboardProps) => {
  // Single source of truth for extraction monitoring
  const { metrics, providerStatus, addExtractionResult, isLoading } = useExtractionMonitoring(organizationId);
  
  if (!showMonitoring) {
    return (
      <ProductUpload 
        organizationId={organizationId} 
        onDataExtracted={onDataExtracted}
        addExtractionResult={addExtractionResult}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload PDF
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monitoring IA
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6">
          <ProductUpload 
            organizationId={organizationId} 
            onDataExtracted={onDataExtracted}
            addExtractionResult={addExtractionResult}
          />
        </TabsContent>
        
        <TabsContent value="monitoring" className="mt-6">
          <ExtractionMonitoringPanel 
            organizationId={organizationId}
            metrics={metrics}
            providerStatus={providerStatus}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};