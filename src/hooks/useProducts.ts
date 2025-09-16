import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ProductData {
  name: string;
  category: 'wine' | 'spirits' | 'champagne' | 'beer';
  vintage?: number;
  alcohol_percentage?: number;
  volume_ml?: number;
  description?: string;
  tasting_notes?: string;
  appellation?: string;
  awards?: string[];
  certifications?: string[];
  technical_specs?: Record<string, any>;
  // Enhanced fields
  terroir?: string;
  vine_age?: number;
  yield_hl_ha?: number;
  vinification?: string;
  aging_details?: string;
  bottling_info?: string;
  ean_code?: string;
  packaging_info?: string;
  availability?: string;
  producer_contact?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  // Anti-hallucination fields
  citations?: Record<string, Array<{ page: number; evidence: string }>> | null;
  confidence?: Record<string, number> | null;
}

export const useProducts = (organizationId?: string) => {
  return useQuery({
    queryKey: ['products', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productData, 
      organizationId 
    }: { 
      productData: ProductData; 
      organizationId: string;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produit créé",
        description: "Le produit a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit.",
        variant: "destructive",
      });
    },
  });
};

// Hook for raw PDF analysis using analyze-pdf-raw function
export const useAnalyzePdfRaw = () => {
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      console.log('🔄 [DEBUG] Début analyse PDF brute:', { fileName: file.name, size: file.size });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-pdf-raw`, {
        method: 'POST',
        body: formData,
      });
      
      const rawText = await response.text();
      
      if (!response.ok) {
        console.error('❌ [DEBUG] Erreur analyse PDF brute:', rawText);
        throw new Error(rawText);
      }
      
      console.log('✅ [DEBUG] Analyse PDF brute réussie:', { textLength: rawText.length });
      
      return rawText;
    },
  });
};

export const useExtractProductData = () => {
  return useMutation({
    mutationFn: async ({ fileUrl, fileName, organizationId }: {
      fileUrl: string;
      fileName: string;
      organizationId: string;
    }) => {
      console.log('🔄 [DEBUG] Début extraction PDF:', { fileUrl, fileName, organizationId });
      
      const { data, error } = await supabase.functions.invoke('extract-product-data-v2', {
        body: { fileUrl, fileName, organizationId }
      });

      console.log('📥 [DEBUG] Réponse Edge Function reçue:', { 
        data, 
        error,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : null,
        hasSuccess: data ? 'success' in data : false,
        successValue: data?.success
      });

      if (error) {
        console.error('❌ [DEBUG] Erreur Edge Function:', error);
        throw error;
      }
      
      // Handle structured error responses (success: false)
      if (data && typeof data === 'object' && data.success === false) {
        console.log('🚫 [DEBUG] Extraction échouée (success: false):', {
          error: data.error,
          details: data.details,
          fallbackSuggested: data.fallbackSuggested
        });
        const structuredError = new Error(data.error || 'Extraction failed');
        (structuredError as any).isStructuredError = true;
        (structuredError as any).details = data.details;
        (structuredError as any).fallbackSuggested = data.fallbackSuggested;
        throw structuredError;
      }
      
      // Verify we have valid data
      if (!data || !data.extractedData) {
        console.error('❌ [DEBUG] Données manquantes dans la réponse:', data);
        throw new Error('Réponse invalide: données d\'extraction manquantes');
      }
      
      console.log('✅ [DEBUG] Extraction réussie:', {
        hasExtractedData: !!data.extractedData,
        productName: data.extractedData?.name,
        dataQuality: data.qualityScore
      });
      
      // Enhanced data mapping to improve form population
      const spec = data?.extractedData ?? data?.data ?? {};
      
      // Ensure we have a proper product name with intelligent fallbacks
      const toAppellationString = (a: any): string | null => {
        if (!a) return null;
        if (typeof a === 'string') return a;
        if (Array.isArray(a)) return a.filter(Boolean).join(', ');
        if (typeof a === 'object') {
          const parts = [a.name || a.label || a.appellation, a.region, a.country].filter(Boolean);
          return parts.length ? parts.join(', ') : null;
        }
        return null;
      };
      const appStr = toAppellationString(spec.appellation) || spec.region || null;


      const mappedData = {
        ...data,
        extractedData: {
          ...spec,
          // Strict ChatGPT mapping - only display what was actually extracted
          name: spec.name || spec.productName || null,
          vintage: spec.vintage || spec.year || null,
          // Keep both for downstream mappers
          abv_percent: spec.abv_percent ?? spec.alcohol ?? spec.alcohol_percentage ?? null,
          alcohol_percentage: spec.alcohol_percentage ?? spec.abv_percent ?? spec.alcohol ?? null,
          volume_ml: spec.volume_ml || (
            /(\d{3,4})\s?m?l/i.test(spec.volume || '') ? parseInt(RegExp.$1) : null
          ),
          appellation: appStr,
          tastingNotes: Array.isArray(spec.tastingNotes)
            ? spec.tastingNotes.join(" · ")
            : (spec.tastingNotes || spec.tasting_notes || null)
        }
      };

      
      return mappedData;
    },
    onError: (error: any) => {
      console.error('Error extracting product data:', error);
      
      // Don't show toast for structured errors - let the component handle them
      if (!error.isStructuredError) {
        toast({
          title: "Erreur d'extraction",
          description: "Impossible d'extraire les données du fichier PDF.",
          variant: "destructive",
        });
      }
    },
  });
};

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .toLowerCase();
};

export const useUploadProductFile = () => {
  return useMutation({
    mutationFn: async ({ file, organizationId }: {
      file: File;
      organizationId: string;
    }) => {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedName}`;
      const filePath = `${organizationId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-files')
        .upload(filePath, file);

      if (error) throw error;

      // Generate signed URL for private bucket access (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('product-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        throw new Error('Failed to create secure file access URL');
      }

      return { 
        publicUrl: signedUrlData.signedUrl, 
        fileName, 
        filePath 
      };
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader le fichier.",
        variant: "destructive",
      });
    },
  });
};