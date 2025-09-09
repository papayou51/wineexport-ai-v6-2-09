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
  const [extractionResult, setExtractionResult] = useState<{ data: ProductData; text: string; metadata?: any } | null>(null);
  const [fallbackContext, setFallbackContext] = useState<any>(null);

  const uploadMutation = useUploadProductFile();
  const extractMutation = useExtractProductData();
  const { trackProductWorkflow, trackError, trackPerformance } = useUserAnalytics();
  const { handleError } = useProductionOptimizations();

  // Fonction pour calculer la qualité des données extraites
  const calculateDataQuality = (data: ProductData, metadata?: any): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 0;
    const maxScore = 100;

    // Détecter si les données proviennent probablement du nom de fichier (extraction de base)
    const isBasicExtraction = metadata?.extraction_notes?.includes('Template document') || 
                             metadata?.extraction_notes?.includes('minimal extractable data') ||
                             metadata?.extraction_notes?.includes('derived from filename');

    // Si c'est une extraction de base, être très strict
    if (isBasicExtraction) {
      issues.push("Données extraites principalement du nom de fichier");
      issues.push("Document semble être un template ou contenir peu de données");
      
      // Score très bas pour les extractions de base
      if (data.name && data.name.trim().length > 2) score += 5;
      if (data.category) score += 5;
      
      const qualityPercent = Math.max(5, Math.min(score, 25)); // Plafonné à 25% pour les extractions de base
      return { score: qualityPercent, issues };
    }

    // Scoring strict pour les vraies extractions
    // Champs essentiels (40 points)
    if (data.name && data.name.trim().length > 5 && !data.name.toLowerCase().includes('château')) {
      score += 15;
    } else if (data.name && data.name.trim().length > 2) {
      score += 5;
      issues.push("Nom du produit générique ou incomplet");
    } else {
      issues.push("Nom du produit manquant");
    }

    if (data.category && data.category !== 'wine') {
      score += 10;
    } else if (data.category) {
      score += 5;
      issues.push("Catégorie générique");
    } else {
      issues.push("Catégorie manquante");
    }

    if (data.description && data.description.trim().length > 50) {
      score += 15;
    } else if (data.description && data.description.trim().length > 10) {
      score += 5;
      issues.push("Description trop courte");
    } else {
      issues.push("Description manquante");
    }

    // Champs techniques importants (35 points)
    if (data.alcohol_percentage && data.alcohol_percentage > 0) {
      score += 10;
    } else {
      issues.push("Degré d'alcool manquant");
    }

    if (data.volume_ml && data.volume_ml > 0) {
      score += 10;
    } else {
      issues.push("Volume manquant");
    }

    if (data.vintage && data.vintage > 1900 && data.vintage <= new Date().getFullYear()) {
      score += 10;
    } else if (data.vintage) {
      score += 3;
      issues.push("Millésime suspect");
    } else {
      issues.push("Millésime manquant");
    }

    if (data.appellation && data.appellation.trim().length > 5 && data.appellation !== 'France') {
      score += 5;
    } else if (data.appellation) {
      score += 2;
      issues.push("Appellation générique");
    } else {
      issues.push("Appellation manquante");
    }

    // Champs bonus (25 points)
    if (data.tasting_notes && data.tasting_notes.trim().length > 10) {
      score += 10;
    } else {
      issues.push("Notes de dégustation manquantes");
    }

    if (data.technical_specs && Object.keys(data.technical_specs).length > 0) {
      score += 5;
    } else {
      issues.push("Spécifications techniques manquantes");
    }

    if (data.awards && data.awards.length > 0) {
      score += 5;
    }

    if (data.certifications && data.certifications.length > 0) {
      score += 5;
    }

    const qualityPercent = Math.min(score, 100);
    return { score: qualityPercent, issues };
  };

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

      const extractResult = await extractMutation.mutateAsync({
        fileUrl: uploadResult.publicUrl,
        fileName: uploadResult.fileName,
        organizationId,
      });

      clearInterval(extractInterval);
      setExtractionProgress(100);
      setCurrentStep('complete');

      if (extractResult.success && extractResult.extractedData) {
        // Valider la qualité des données extraites
        const quality = calculateDataQuality(extractResult.extractedData, extractResult.metadata);
        
        console.log('Data quality assessment:', {
          score: quality.score,
          issues: quality.issues,
          extractedData: extractResult.extractedData
        });

        // Sauvegarder les résultats pour le debugging
        setExtractionResult({
          data: extractResult.extractedData,
          text: extractResult.extractedText,
          metadata: { 
            ...extractResult.metadata, 
            qualityScore: quality.score,
            qualityIssues: quality.issues
          }
        });

        // Track successful extraction with provider info
        await trackProductWorkflow('data_extraction', undefined, undefined, {
          success: true,
          extraction_time: performance.now() - startTime,
          extracted_fields: Object.keys(extractResult.extractedData).length,
          quality_score: quality.score,
          provider: extractResult.metadata?.provider || 'unknown',
          file_name: file.name,
          file_size: file.size,
        });
        
        await trackPerformance('pdf_extraction', performance.now() - startTime);
        
        // Add to local monitoring
        if (addExtractionResult) {
          // Extract provider from the providers.runs array (get the successful one)
          const successfulProvider = extractResult.providers?.runs?.find(run => run.ok === true)?.provider || 'unknown';
          
          console.log('🔄 [DEBUG] Adding extraction result to monitoring:', {
            provider: successfulProvider,
            success: true,
            qualityScore: quality.score,
            extractionTime: performance.now() - startTime,
            fileName: file.name,
            organizationId,
            providersData: extractResult.providers
          });
          addExtractionResult({
            provider: successfulProvider,
            success: true,
            qualityScore: quality.score,
            extractionTime: performance.now() - startTime,
            fileName: file.name,
            providers: extractResult.providers
          });
        } else {
          console.log('⚠️ [DEBUG] addExtractionResult function not provided');
        }
        
        onDataExtracted(extractResult.extractedData, extractResult.extractedText, quality.score);
        
        // Enhanced feedback with diagnostic information
        const providerName = extractResult.metadata?.provider || 'IA';
        const providerIcon = providerName === 'anthropic' ? '🤖' : 
                           providerName === 'google' ? '🧠' : 
                           providerName === 'openai' ? '🚀' : '🔧';
        
        const extractionType = extractResult.metadata?.extractionType || 'unknown';
        const fallbackContext = extractResult.metadata?.fallbackContext;
        
        // Enhanced quality-based feedback with troubleshooting
        if (quality.score < 15) {
          let description = `${providerIcon} ${providerName} - Qualité: ${quality.score}%.`;
          
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
        } else if (quality.score < 40) {
          let description = `${providerIcon} ${providerName} - Qualité: ${quality.score}%. Données limitées extraites.`;
          
          if (extractionType === 'text_fallback') {
            description += ` Extraction de secours utilisée.`;
          }
          
          toast({
            title: "Extraction partielle",
            description: description,
          });
        } else if (quality.score < 70) {
          toast({
            title: "Données extraites",
            description: `${providerIcon} ${providerName} - Qualité: ${quality.score}%. Bonnes données extraites. Veuillez vérifier les détails.`,
          });
        } else {
          toast({
            title: "Extraction excellente", 
            description: `${providerIcon} ${providerName} - Qualité: ${quality.score}%. Extraction complète réussie!`,
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
      
      if (error instanceof Error) {
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
            {isDragActive ? 'Déposez votre fichier ici' : 'Uploadez une fiche technique'}
          </h3>
          
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Glissez-déposez un fichier PDF ou cliquez pour sélectionner. Notre IA extraira automatiquement toutes les informations produit.
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