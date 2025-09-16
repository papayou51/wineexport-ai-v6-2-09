import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useUploadProductFile, useExtractProductData, ProductData } from "@/hooks/useProducts";
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { useProductionOptimizations } from '@/hooks/useProductionOptimizations';
import { ExtractionDebugDialog } from "./ExtractionDebugDialog";
import { DiagnosticPanel } from "./DiagnosticPanel";
import { ValidationReportDialog } from './ValidationReportDialog';
import { RawJsonDisplay } from './RawJsonDisplay';
import { formatLLMError } from "@/utils/llmError";

interface ProductUploadProps {
  organizationId: string;
  onDataExtracted: (data: ProductData, extractedText: string, qualityScore?: number) => void;
  addExtractionResult?: (result: Omit<import('@/hooks/useExtractionMonitoring').ExtractionResult, 'id' | 'timestamp'>) => void;
}

export const ProductUpload = ({ organizationId, onDataExtracted, addExtractionResult }: ProductUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'idle' | 'uploading' | 'extracting' | 'complete' | 'error' | 'manual-fallback'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string>('');
  const [extractionResult, setExtractionResult] = useState<{ data: ProductData; text: string; metadata?: any; rawData?: any } | null>(null);
  const [fallbackContext, setFallbackContext] = useState<any>(null);
  const [processedFileName, setProcessedFileName] = useState<string>('');
  const [validationReport, setValidationReport] = useState<any>(null);

  const uploadMutation = useUploadProductFile();
  const extractMutation = useExtractProductData();
  const { trackProductWorkflow, trackError, trackPerformance } = useUserAnalytics();
  const { handleError } = useProductionOptimizations();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Track start of workflow
      await trackProductWorkflow('pdf_upload', undefined, undefined, {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });

      const startTime = performance.now();

      // Step 1: Upload file
      setCurrentStep('uploading');
      setUploadProgress(0);
      
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const uploadResult = await uploadMutation.mutateAsync({ file, organizationId });
      clearInterval(uploadInterval);
      setUploadProgress(100);

      // Step 2: Extract data
      setCurrentStep('extracting');
      setExtractionProgress(0);

      // Simulate extraction progress
      const extractInterval = setInterval(() => {
        setExtractionProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const result = await extractMutation.mutateAsync({
        fileUrl: uploadResult.publicUrl,
        fileName: uploadResult.fileName,
        organizationId,
      });

      clearInterval(extractInterval);
      setExtractionProgress(100);

      // Check if this is a successful response with error details (strict mode)
      if (!result.success) {
        // Handle specific strict mode errors
        const errorCode = result.error || 'UNKNOWN_ERROR';
        const errorMessage = result.details || result.error || 'Extraction failed';
        
        if (errorCode.startsWith('GOOGLE_') || errorCode.startsWith('STRICT_')) {
          console.error(`❌ Strict mode error [${errorCode}]:`, errorMessage);
          
          setCurrentStep('error');
          setLastError(errorMessage);
          
          toast({
            title: "Mode Strict AI - Erreur",
            description: `Code: ${errorCode}. ${errorMessage}`,
            variant: "destructive",
          });
          
          return;
        }
        
        throw new Error(errorMessage);
      }

      setCurrentStep('complete');

      if (result.success && result.extractedData) {
        // Use V2 backend quality score directly instead of recalculating
        const backendQualityScore = result.qualityScore || 0;
        
        console.log('✅ V2 Extraction completed:', {
          backendScore: backendQualityScore,
          provider: result.extractionSource,
          extractedData: result.extractedData
        });

        // Sauvegarder les résultats pour le debugging - MODE STRICT
        setExtractionResult({
          data: result.extractedData,
          text: result.extractedText,
          rawData: result.metadata?.rawExtractedData,
          metadata: { 
            ...result.metadata, 
            qualityScore: backendQualityScore,
            extractionVersion: 'V2.2-STRICT'
          }
        });
        
        // Store validation info for UI display
        setProcessedFileName(result.metadata?.filename || uploadResult.fileName);
        setValidationReport(result.metadata?.validationReport);

        // Track successful extraction with provider info
        await trackProductWorkflow('data_extraction', undefined, undefined, {
          success: true,
          extraction_time: performance.now() - startTime,
          extracted_fields: Object.keys(result.extractedData).length,
          quality_score: backendQualityScore,
          provider: result.extractionSource || 'v2-backend',
          file_name: file.name,
          file_size: file.size,
        });
        
        await trackPerformance('pdf_extraction', performance.now() - startTime);
        
        // Add to local monitoring
        if (addExtractionResult) {
          
          // Extract provider with multiple fallback strategies
          let successfulProvider = 'unknown';
          
          // Strategy 1: Check providers.runs array
          if (result.providers?.runs) {
            const successfulRun = result.providers.runs.find(run => run.ok === true || run.success === true);
            if (successfulRun) {
              successfulProvider = successfulRun.provider;
            }
          }
          
          // Strategy 2: Check metadata.runs array  
          if (successfulProvider === 'unknown' && result.metadata?.runs) {
            const successfulRun = result.metadata.runs.find(run => run.success === true);
            if (successfulRun) {
              successfulProvider = successfulRun.provider;
            }
          }
          
          // Strategy 3: Check extractionSource field (V2 primary field)
          if (successfulProvider === 'unknown' && result.extractionSource) {
            successfulProvider = result.extractionSource;
          }
          
          // Strategy 4: Check direct provider field (legacy)
          if (successfulProvider === 'unknown' && result.provider) {
            successfulProvider = result.provider;
          }
          
          // Strategy 5: Check primaryProvider field (legacy)
          if (successfulProvider === 'unknown' && result.primaryProvider) {
            successfulProvider = result.primaryProvider;
          }
          
          // Add extraction result to monitoring with V2 provider info
          addExtractionResult({
            provider: successfulProvider,
            success: true,
            qualityScore: backendQualityScore,
            extractionTime: performance.now() - startTime,
            fileName: file.name,
            providers: result.providers
          });
        }
        
        // Transform V2 API data to ProductData - Preserve ALL ChatGPT extractions
const transformV2ToProductData = (v2Data: any) => {
  const formatAppellation = (a: any): string | null => {
    if (!a) return null;
    if (typeof a === 'string') return a;
    if (Array.isArray(a)) return a.filter(Boolean).join(', ');
    if (typeof a === 'object') {
      const parts = [a.name || a.label || a.appellation, a.region, a.country].filter(Boolean);
      return parts.length ? parts.join(', ') : null;
    }
    return null;
  };
  
  console.log('🔄 V2 Data received for transformation:', Object.keys(v2Data));
  
  return {
            // Keep ALL original data first
            ...v2Data,
            // Strict ChatGPT mapping - only display what was actually extracted
            name: v2Data.name || v2Data.productName || null,
            tasting_notes: v2Data.tasting_notes || v2Data.tastingNotes || null,
            alcohol_percentage: v2Data.alcohol_percentage || v2Data.abv_percent || v2Data.alcohol || null,
            description: v2Data.description || null,
            appellation: formatAppellation(v2Data.appellation) || null,
            // Enhanced field mappings
            terroir: v2Data.terroir,
            vine_age: v2Data.vineAge_years || v2Data.vine_age,
            yield_hl_ha: v2Data.yieldHlHa || v2Data.yield_hl_ha,
            vinification: v2Data.vinificationDetails || v2Data.vinification,
            aging_details: v2Data.agingDetails || v2Data.aging_details,
            bottling_info: v2Data.bottlingDate || v2Data.bottling_info,
            ean_code: v2Data.eanCode || v2Data.ean_code,
            packaging_info: v2Data.packagingDetails || v2Data.packaging_info || v2Data.packaging,
            availability: v2Data.availability,
            producer_contact: v2Data.producerContact || v2Data.producer_contact,
            // Technical specs mapping
            technical_specs: {
              ...v2Data.technical_specs,
              ph: v2Data.ph || v2Data.technical_specs?.ph,
              total_acidity: v2Data.acidity_gL || v2Data.technical_specs?.total_acidity,
              residual_sugar: v2Data.residualSugar_gL || v2Data.technical_specs?.residual_sugar,
              so2_total: v2Data.so2_total || v2Data.technical_specs?.so2_total,
              grape_varieties: v2Data.grapes ? 
                Array.isArray(v2Data.grapes) ? 
                  v2Data.grapes.map((g: any) => `${g.variety}${g.percent ? ` ${g.percent}%` : ''}`).join(', ') :
                  v2Data.grapes : 
                v2Data.technical_specs?.grape_varieties,
              serving_temperature: v2Data.servingTemp_C ? `${v2Data.servingTemp_C}°C` : v2Data.technical_specs?.serving_temperature,
              aging_potential: v2Data.ageingPotential_years ? `${v2Data.ageingPotential_years} ans` : v2Data.technical_specs?.aging_potential
            },
            // Remove V2-specific fields that don't match ProductData
            productName: undefined,
            tastingNotes: undefined,
            abv_percent: undefined,
            vineAge_years: undefined,
            yieldHlHa: undefined,
            vinificationDetails: undefined,
            agingDetails: undefined,
            bottlingDate: undefined,
            eanCode: undefined,
            packagingDetails: undefined,
            producerContact: undefined,
            acidity_gL: undefined,
            residualSugar_gL: undefined,
            servingTemp_C: undefined,
            ageingPotential_years: undefined,
            grapes: undefined
          };
        };
        
        const transformedData = transformV2ToProductData(result.extractedData);
        onDataExtracted(transformedData, result.extractedText || "", backendQualityScore);
        
        // Enhanced feedback with diagnostic information
        const providerName = result.extractionSource || result.metadata?.provider || 'V2';
        const providerIcon = providerName === 'anthropic' ? '🤖' : 
                           providerName === 'google' ? '🧠' : 
                           providerName === 'openai' ? '🚀' : '🔧';
        
        const extractionType = result.metadata?.extractionType || 'v2_extraction';
        const fallbackContext = result.metadata?.fallbackContext;
        
        // Check for hallucination detection
        const droppedFields = result.metadata?.validationReport?.droppedFields || 0;
        if (droppedFields > 0) {
          toast({
            title: "🚨 Hallucination détectée",
            description: `${droppedFields} champs sans preuves ont été supprimés. Seules les données vérifiables sont affichées.`,
            variant: "destructive",
          });
        }

        // Enhanced V2 quality-based feedback with troubleshooting
        if (backendQualityScore < 15) {
          let description = `🚀 Extraction V2 - Qualité: ${backendQualityScore}%.`;
          
          if (extractionType === 'text_fallback' && fallbackContext) {
            description += ` Problème détecté: ${fallbackContext.recommendedAction || 'PDF non accessible'}`;
          } else {
            description += ` Document probablement vide ou illisible.`;
          }
          
          toast({
            title: "Vérification requise",
            description: description,
            variant: "destructive",
          });
        } else if (backendQualityScore < 40) {
          let description = `🚀 Extraction V2 - Qualité: ${backendQualityScore}%. Données limitées extraites.`;
          
          if (extractionType === 'text_fallback') {
            description += ` Extraction de secours utilisée.`;
          }
          
          toast({
            title: "Extraction partielle",
            description: description,
          });
        } else if (backendQualityScore < 70) {
          toast({
            title: "Données extraites",
            description: `🚀 Extraction V2 - Qualité: ${backendQualityScore}%. Bonnes données extraites. Veuillez vérifier les détails.`,
          });
        } else if (backendQualityScore >= 85) {
          toast({
            title: "🏆 Extraction V2 Premium", 
            description: `Qualité exceptionnelle: ${backendQualityScore}%. Toutes les données ont été extraites avec précision!`,
          });
        } else {
          toast({
            title: "✨ Extraction V2 Excellente", 
            description: `Qualité: ${backendQualityScore}%. Extraction complète réussie avec le système optimisé!`,
          });
        }
      } else {
        throw new Error('Failed to extract data');
      }

    } catch (error: any) {
      console.error('Upload/extraction error:', error);
      
      // Check if this is an orchestrator failure with provider information
      if (error.error === 'ORCHESTRATOR_EXECUTION_FAILED' || (error.providers && error.providers.runs)) {
        const formattedError = formatLLMError(error);
        
        // Add to monitoring with provider data
        if (addExtractionResult) {
          addExtractionResult({
            provider: 'multiple_failed',
            success: false,
            extractionTime: 5000, // Estimated time for failed extraction
            errorMessage: formattedError,
            fileName: file.name,
            providers: error.providers
          });
        }
        
        setCurrentStep('error');
        setUploadProgress(0);
        setExtractionProgress(0);
        
        toast({
          title: "Extraction échouée",
          description: formattedError,
          variant: "destructive",
        });
        
        return;
      }
      
      // Check if this is a structured error from failed extraction
      if (error.isStructuredError && error.fallbackSuggested) {
        setCurrentStep('manual-fallback');
        setFallbackContext({
          error: error.message,
          details: error.details,
          fileName: file.name
        });
        
        toast({
          title: "Extraction automatique échouée",
          description: `${error.message} Vous pouvez saisir les informations manuellement.`,
          variant: "destructive",
        });
        
        // Track structured extraction failure
        await trackError(error, {
          step: 'pdf_extraction_structured_failure',
          file_name: file.name,
          file_size: file.size,
          provider: 'multiple_failed',
          structured_error: true,
        });
        
        return; // Don't proceed with generic error handling
      }
      
      // Track extraction error with more context
      await trackError(error instanceof Error ? error : new Error('Upload/extraction error'), {
        step: 'pdf_upload_extraction',
        file_name: file.name,
        file_size: file.size,
        current_step: currentStep,
        retry_count: retryCount,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        provider: 'unknown',
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      
      // Retry logic pour les erreurs temporaires
      if (retryCount < 2 && (errorMessage.includes('network') || errorMessage.includes('timeout'))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          console.log(`Retry attempt ${retryCount + 1}/2`);
          onDrop([file]); // Retry automatique
        }, 2000 * (retryCount + 1)); // Délai progressif
        return;
      }
      
      // Add failed extraction to monitoring
      if (addExtractionResult) {
        addExtractionResult({
          provider: 'unknown',
          success: false,
          extractionTime: performance.now() - (performance.now() - 5000), // Estimated time
          errorMessage: errorMessage,
          fileName: file.name
        });
      }
      
      setCurrentStep('error');
      setUploadProgress(0);
      setExtractionProgress(0);
      
      // Enhanced error analysis and user guidance
      let toastErrorMessage = "Erreur de traitement";
      let errorDescription = "Veuillez réessayer ou contacter le support si le problème persiste.";
      let errorSuggestions = [];
      
      // Handle V2 extraction specific errors
      if (error.error === 'SCHEMA_VALIDATION_ERROR') {
        toastErrorMessage = "Erreur de schéma IA";
        errorDescription = "Mise à jour du système en cours. Réessayez dans 1-2 minutes.";
        errorSuggestions.push("Réessayez dans quelques minutes");
        errorSuggestions.push("Le système se corrige automatiquement");
      } else if (error.error === 'EXTRACTION_TIMEOUT') {
        toastErrorMessage = "Traitement trop lent";
        errorDescription = "Document trop complexe. Utilisez un PDF plus simple ou réessayez.";
        errorSuggestions.push("Utilisez un PDF avec moins de pages");
        errorSuggestions.push("Réessayez avec une meilleure qualité de scan");
      } else if (error.error === 'PDF_ACCESS_ERROR') {
        toastErrorMessage = "PDF inaccessible";
        errorDescription = "Le PDF ne peut pas être lu. Vérifiez le format et la qualité.";
        errorSuggestions.push("Vérifiez que le PDF n'est pas protégé");
        errorSuggestions.push("Exportez le PDF à nouveau");
      } else if (error.error === 'API_KEY_ERROR') {
        toastErrorMessage = "Problème d'authentification";
        errorDescription = "Service IA temporairement indisponible. Contactez le support.";
        errorSuggestions.push("Contactez le support technique");
        errorSuggestions.push("Réessayez plus tard");
      } else if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('bucket not found')) {
          toastErrorMessage = "Problème de configuration";
          errorDescription = "Stockage temporairement indisponible.";
          errorSuggestions.push("Réessayez dans quelques minutes");
          errorSuggestions.push("Contactez le support si le problème persiste");
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          toastErrorMessage = "Fichier introuvable";
          errorDescription = "Le fichier n'a pas pu être localisé après l'upload.";
          errorSuggestions.push("Réessayez l'upload complet");
          errorSuggestions.push("Vérifiez que le PDF n'est pas corrompu");
        } else if (errorMsg.includes('access denied') || errorMsg.includes('403')) {
          toastErrorMessage = "Accès refusé";
          errorDescription = "Permissions insuffisantes pour accéder au fichier.";
          errorSuggestions.push("Reconnectez-vous à votre compte");
          errorSuggestions.push("Contactez l'administrateur");
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          toastErrorMessage = "Problème de connexion";
          errorDescription = "Connexion internet instable détectée.";
          errorSuggestions.push("Vérifiez votre connexion internet");
          errorSuggestions.push("Réessayez dans quelques secondes");
        } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          toastErrorMessage = "Délai d'attente dépassé";
          errorDescription = "Le traitement a pris trop de temps.";
          errorSuggestions.push("Réduisez la taille du PDF si possible");
          errorSuggestions.push("Essayez à un moment de moindre affluence");
        } else if (errorMsg.includes('guardrails violation') || errorMsg.includes('token limit') || errorMsg.includes('exceeds task limit')) {
          toastErrorMessage = "Document trop volumineux";
          errorDescription = "Le PDF contient trop de texte pour être traité en une fois.";
          errorSuggestions.push("Essayez avec un PDF plus court");
          errorSuggestions.push("Divisez le document en sections plus petites");
          errorSuggestions.push("Utilisez un PDF avec moins de pages de texte");
        } else if (errorMsg.includes('format') || errorMsg.includes('invalid pdf')) {
          toastErrorMessage = "PDF non valide";
          errorDescription = "Le fichier PDF ne peut pas être lu correctement.";
          errorSuggestions.push("Vérifiez que le PDF s'ouvre normalement");
          errorSuggestions.push("Essayez avec un autre fichier PDF");
          errorSuggestions.push("Convertissez le fichier au format PDF standard");
        } else if (errorMsg.includes('too large')) {
          toastErrorMessage = "Fichier trop volumineux";
          errorDescription = "Le PDF dépasse la taille limite autorisée.";
          errorSuggestions.push("Compressez le PDF");
          errorSuggestions.push("Utilisez un fichier de moins de 50MB");
        }
        
        // Handle HTTP status 546 (CPU timeout) specifically 
        if ((error as any).status === 546 || errorMsg.includes('cpu time exceeded')) {
          toastErrorMessage = "Délai de traitement dépassé";
          errorDescription = "Le traitement a dépassé la limite de temps autorisée. Le document est peut-être trop complexe.";
          errorSuggestions = ["Réessayez maintenant", "Utilisez un PDF plus simple"];
        }
      }
      
      // Include suggestions in the toast if any
      if (errorSuggestions.length > 0) {
        errorDescription += ` Suggestions: ${errorSuggestions.slice(0, 2).join(', ')}.`;
      }
      
      toast({
        title: toastErrorMessage,
        description: errorDescription,
        variant: "destructive",
      });
    }
  }, [organizationId, uploadMutation, extractMutation, onDataExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: currentStep !== 'idle'
  });

  const resetUpload = () => {
    setCurrentStep('idle');
    setUploadProgress(0);
    setExtractionProgress(0);
    setRetryCount(0);
    setLastError('');
    setExtractionResult(null);
    setFallbackContext(null);
  };

  const handleManualEntry = () => {
    // Create minimal data from filename for manual entry
    const fileName = fallbackContext?.fileName || 'Document';
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    
    const manualData: ProductData = {
      name: baseName,
      category: 'wine', // Default category
      description: 'Données à compléter manuellement'
    };
    
    onDataExtracted(manualData, 'Saisie manuelle depuis échec extraction automatique', 0);
    setCurrentStep('complete');
  };

  if (currentStep === 'complete') {
    return (
      <Card className="border-2 border-dashed border-wine-light bg-wine-deep/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-wine-medium mb-4" />
          <h3 className="text-lg font-semibold text-wine-deep mb-2">
            Extraction terminée !
          </h3>
          <p className="text-muted-foreground text-center mb-4">
            Les données de votre produit ont été extraites et structurées.
          </p>
          {/* Show diagnostic panel if quality is low */}
          {extractionResult && extractionResult.metadata?.qualityScore < 40 && (
            <div className="mb-4">
              <DiagnosticPanel
                diagnosticInfo={{
                  extractionType: extractionResult.metadata?.extractionType,
                  fallbackContext: extractionResult.metadata?.fallbackContext,
                  qualityScore: extractionResult.metadata?.qualityScore,
                  qualityIssues: extractionResult.metadata?.qualityIssues
                }}
                onRetry={resetUpload}
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            {extractionResult && (
              <ExtractionDebugDialog
                extractedData={extractionResult.data}
                extractedText={extractionResult.text}
                metadata={extractionResult.metadata}
              />
            )}
            {validationReport && (
              <ValidationReportDialog
                validationReport={validationReport}
                rawData={extractionResult?.metadata?.rawExtractedData}
                processedData={extractionResult?.data}
                qualityScore={extractionResult?.metadata?.qualityScore}
              />
            )}
            <Button onClick={resetUpload} variant="outline">
              Uploader un autre fichier
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // État de fallback manuel
  if (currentStep === 'manual-fallback') {
    return (
      <Card className="border-2 border-dashed border-amber-500 bg-amber-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-16 w-16 text-amber-600 mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Extraction automatique échouée
          </h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {fallbackContext?.error || "L'IA n'a pas pu extraire les données du PDF."}
          </p>
          {fallbackContext?.details && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
              <p><strong>Détails:</strong> {fallbackContext.details.suggestion}</p>
              {fallbackContext.details.pdfSize && (
                <p><strong>Taille PDF:</strong> {Math.round(fallbackContext.details.pdfSize / 1024)} KB</p>
              )}
              {fallbackContext.details.availableProviders && (
                <p><strong>Providers tentés:</strong> {fallbackContext.details.availableProviders.join(', ')}</p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleManualEntry} className="bg-amber-600 hover:bg-amber-700">
              Saisir manuellement
            </Button>
            <Button onClick={resetUpload} variant="outline">
              Essayer un autre fichier
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // État d'erreur avec retry
  if (currentStep === 'error') {
    return (
      <Card className="border-2 border-destructive bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Erreur lors du traitement
          </h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {lastError || "Une erreur inattendue s'est produite lors du traitement du fichier."}
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Tentatives: {retryCount}/2
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={resetUpload} variant="outline">
              Réessayer avec un autre fichier
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep !== 'idle') {
    return (
      <Card className="border-2 border-wine-medium animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {currentStep === 'uploading' ? 'Upload en cours...' : 'Extraction des données...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 'uploading' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between text-sm font-medium">
                <span>Upload du fichier</span>
                <span className="text-wine-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Téléchargement sécurisé de votre fichier PDF...
              </p>
            </div>
          )}
          
          {currentStep === 'extracting' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Extraction par IA</span>
                  <span className="text-wine-medium">{extractionProgress}%</span>
                </div>
                <Progress value={extractionProgress} className="h-3" />
              </div>
              
              {/* Skeleton for AI processing */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-wine-medium rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2 pl-7">
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                  <div className="h-2 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                L'IA analyse votre document pour extraire automatiquement les informations produit. Providers disponibles: Anthropic 🤖, Google 🧠, OpenAI 🚀
              </p>
            </div>
          )}
          
          {/* Cancel button */}
          <div className="flex justify-end pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetUpload}
              className="text-muted-foreground hover:text-foreground"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 border-dashed transition-all duration-300 hover-scale ${
      isDragActive 
        ? 'border-wine-medium bg-wine-deep/10 scale-105' 
        : 'border-muted-foreground/25 hover:border-wine-light hover:bg-wine-deep/5'
    }`}>
      <CardContent {...getRootProps()} className="cursor-pointer">
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className={`rounded-full bg-wine-deep/10 p-3 sm:p-4 mb-4 transition-all duration-300 ${
            isDragActive ? 'scale-110' : ''
          }`}>
            {isDragActive ? (
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-wine-medium animate-bounce" />
            ) : (
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-wine-deep" />
            )}
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold text-wine-deep mb-2 text-center">
            {isDragActive ? 'Déposez votre fichier ici' : '🚀 Extraction V2 - Système optimisé'}
          </h3>
          
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Glissez-déposez un fichier PDF ou cliquez pour sélectionner. Notre système V2 avec IA avancée extraira automatiquement toutes les informations produit avec une précision remarquable.
          </p>
          
          <Button variant="outline" className="mb-3 hover-scale">
            Sélectionner un fichier
          </Button>
          
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Format supporté : PDF (max 10MB)
            </p>
            <p className="text-xs text-muted-foreground">
              Fiches techniques, catalogues, documents commerciaux
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};