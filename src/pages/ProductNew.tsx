import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductExtractionDashboard } from "@/components/ProductExtractionDashboard";
import { ProductForm } from "@/components/ProductForm";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useOrganization } from "@/hooks/useOrganization";
import { RawJsonDisplay } from "@/components/RawJsonDisplay";
import { RawTextDisplay } from "@/components/RawTextDisplay";
import { useAnalyzePdfRaw } from "@/hooks/useProducts";

export default function ProductNew() {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [rawAnalysisResult, setRawAnalysisResult] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const analyzePdfMutation = useAnalyzePdfRaw();
  
  // Check if we're in strict AI mode
  const isStrictMode = import.meta.env.VITE_STRICT_AI_MODE === 'true';

  const handleDataExtracted = (data: any, extractedText: string, qualityScore?: number) => {
    console.log('📋 [DEBUG] Data extracted callback:', { data, extractedText, qualityScore });
    setExtractedData(data);
    setExtractedText(extractedText);
    setQualityScore(qualityScore || 0);
  };

  const handleRawAnalysis = async (file: File) => {
    try {
      setCurrentFileName(file.name);
      const result = await analyzePdfMutation.mutateAsync({ file });
      setRawAnalysisResult(result);
    } catch (error) {
      console.error('❌ [DEBUG] Raw analysis failed:', error);
      // Error is handled by the mutation's error state
    }
  };
  
  const downloadRawText = () => {
    if (rawAnalysisResult) {
      const blob = new Blob([rawAnalysisResult], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raw-analysis-${currentFileName || 'document'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
                  "Mode Strict 100% IA - Analyse brute du PDF sans normalisation ni fallback" :
                  "Téléchargez une fiche technique PDF pour extraire automatiquement les informations du produit"
                }
              </p>
            </div>
          </div>

          {isStrictMode ? (
            // Strict Mode: Direct PDF raw analysis
            <div className="space-y-8">
              {!rawAnalysisResult ? (
                <div className="max-w-xl mx-auto">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4 hover:border-muted-foreground/50 transition-colors"
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      const pdfFile = files.find(f => f.type === 'application/pdf');
                      if (pdfFile) handleRawAnalysis(pdfFile);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      📄
                    </div>
                    <div>
                      <h3 className="font-semibold">Mode Strict - Analyse PDF Brute</h3>
                      <p className="text-sm text-muted-foreground">
                        Glissez votre PDF ici ou cliquez pour sélectionner
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRawAnalysis(file);
                      }}
                      className="hidden"
                      id="pdf-upload-strict"
                    />
                    <label 
                      htmlFor="pdf-upload-strict"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
                    >
                      Sélectionner un PDF
                    </label>
                    {analyzePdfMutation.isPending && (
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-2">Analyse en cours...</p>
                      </div>
                    )}
                    {analyzePdfMutation.error && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">
                          {analyzePdfMutation.error?.message || 'Erreur lors de l\'analyse'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <RawTextDisplay
                  rawText={rawAnalysisResult}
                  extractionSource="analyze-pdf-raw"
                  fileName={currentFileName}
                  onDownload={downloadRawText}
                  onNewExtraction={() => {
                    setRawAnalysisResult('');
                    setCurrentFileName('');
                  }}
                />
              )}
            </div>
          ) : (
            // Standard Mode
            <>
              {!extractedData ? (
                <ProductExtractionDashboard 
                  organizationId={organization.id}
                  onDataExtracted={handleDataExtracted}
                />
              ) : (
                <div className="space-y-8">
                  {/* Standard Mode: Show extraction + form */}
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}