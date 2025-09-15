import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductExtractionDashboard } from "@/components/ProductExtractionDashboard";
import { ProductForm } from "@/components/ProductForm";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useOrganization } from "@/hooks/useOrganization";
import { RawJsonDisplay } from "@/components/RawJsonDisplay";

export default function ProductNew() {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number>(0);
  const navigate = useNavigate();
  const { organization } = useOrganization();
  
  // Check if we're in strict AI mode
  const isStrictMode = import.meta.env.VITE_STRICT_AI_MODE === 'true';

  const handleDataExtracted = (data: any, extractedText: string, qualityScore?: number) => {
    console.log('📋 [DEBUG] Data extracted callback:', { data, extractedText, qualityScore });
    setExtractedData(data);
    setExtractedText(extractedText);
    setQualityScore(qualityScore || 0);
  };
  
  const downloadJsonData = () => {
    if (extractedData?.rawData) {
      const jsonString = JSON.stringify(extractedData.rawData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extraction-raw-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSuccess = (product?: any) => {
    if (product) {
      navigate(`/products/${product.id}`);
    } else {
      navigate('/products');
    }
  };

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <LoadingSkeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
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
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Nouveau Produit</h1>
              <p className="text-muted-foreground mt-2">
                {isStrictMode ? 
                  "Mode Strict 100% IA - Extraction brute sans normalisation ni fallback" :
                  "Téléchargez une fiche technique PDF pour extraire automatiquement les informations du produit"
                }
              </p>
            </div>
          </div>

          {!extractedData ? (
            <ProductExtractionDashboard 
              organizationId={organization.id}
              onDataExtracted={handleDataExtracted}
            />
          ) : (
            <div className="space-y-8">
              {isStrictMode ? (
                // Strict Mode: Show only raw JSON data
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Données Extraites - Mode Strict 100% IA</h2>
                    <div className="flex gap-4">
                      <button
                        onClick={downloadJsonData}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Télécharger JSON
                      </button>
                      <button
                        onClick={() => setExtractedData(null)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                      >
                        Nouvelle extraction
                      </button>
                    </div>
                  </div>
                  
                  <RawJsonDisplay
                    rawData={extractedData.rawData}
                    qualityScore={qualityScore}
                    extractionSource={extractedData.extractionSource}
                  />
                </div>
              ) : (
                // Standard Mode: Show extraction + form
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <ProductExtractionDashboard 
                      organizationId={organization.id}
                      onDataExtracted={handleDataExtracted}
                    />
                  </div>
                  
                  <div className="space-y-6">
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
          )}
        </div>
      </div>
    </div>
  );
}