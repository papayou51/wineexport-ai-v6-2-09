import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductExtractionDashboard } from "@/components/ProductExtractionDashboard";
import { ProductForm } from "@/components/ProductForm";
import { ProductData } from "@/hooks/useProducts";
import { useOrganization } from "@/hooks/useOrganization";

const ProductNew = () => {
  const navigate = useNavigate();
  const [extractedData, setExtractedData] = useState<ProductData | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [qualityScore, setQualityScore] = useState<number | undefined>(undefined);
  const { organization } = useOrganization();

  const handleDataExtracted = (data: ProductData, text: string, quality?: number) => {
    setExtractedData(data);
    setExtractedText(text);
    setQualityScore(quality);
  };

  const handleSuccess = (product?: any) => {
    if (product) {
      // Show option to start full analysis
      navigate(`/products/${product.id}?showAnalysisOption=true`);
    } else {
      navigate('/products');
    }
  };

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full mx-auto animate-pulse" />
              <div className="h-6 w-48 bg-muted rounded mx-auto animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 hover-scale"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Nouveau produit</h1>
            <p className="text-sm text-muted-foreground">
              Uploadez une fiche technique PDF pour extraire automatiquement les données avec notre système V2 optimisé
            </p>
          </div>
        </div>
        
        <div className="space-y-8">
          {!extractedData ? (
            <div className="transition-all duration-500 ease-in-out">
              <ProductExtractionDashboard
                organizationId={organization.id}
                onDataExtracted={handleDataExtracted}
                showMonitoring={true}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 transition-all duration-500 ease-in-out">
              {/* Monitoring Panel - Compact Version */}
              <div className="xl:col-span-1">
                <div className="sticky top-8">
                  <ProductExtractionDashboard
                    organizationId={organization.id}
                    onDataExtracted={handleDataExtracted}
                    showMonitoring={true}
                  />
                </div>
              </div>
              
              {/* Product Form */}
              <div className="xl:col-span-2">
                <ProductForm
                  initialData={extractedData}
                  extractedText={extractedText}
                  organizationId={organization.id}
                  onSuccess={handleSuccess}
                  extractionQuality={qualityScore}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductNew;