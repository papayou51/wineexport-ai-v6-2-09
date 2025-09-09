import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { runOrchestrator } from "../_shared/ai-orchestrator/orchestrator.ts";
import { computeQuality } from "../_shared/ai-orchestrator/quality.ts";
import { PDFExtractor } from "../_shared/pdf-extractor.ts";
import { WineProductSpecSchema } from "../_shared/spec-schema.ts";
import { normalizeSpec } from "../_shared/spec-normalize.ts";
import { callGoogleFromRawPDF } from "../_shared/ai-orchestrator/providers/google-pdf.ts";
import { ocrFallbackFromPdf } from "../_shared/ocr.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced PDF text extraction with OCR fallback
async function extractPDFSafe(buf: ArrayBuffer): Promise<{ page: number; text: string }[]> {
  try {
    // Try native PDF text extraction first
    const result = PDFExtractor.extractText(buf, "pdf");
    const pages = result.text.split('\n\n').map((text, index) => ({
      page: index + 1,
      text: text.trim()
    })).filter(p => p.text.length > 0);

    // If text is too sparse, we might need OCR, but for now return what we have
    const totalLength = pages.reduce((sum, p) => sum + p.text.length, 0);
    console.log(`[PDF] Extracted ${pages.length} pages, total chars: ${totalLength}`);

    if (totalLength < 100) {
      console.warn("[PDF] Very little text → try OCR");
      if (Deno.env.get("OCR_ENABLED") === "1") {
        // TODO: Implement OCR extraction here
        // const ocrPages = await extractTextOCR(buf);
        // if (ocrPages?.length && ocrPages.some(p => p.text.trim().length > 20)) return ocrPages;
        console.log("[PDF] OCR not implemented yet");
      }
      // Return empty array to trigger PDF_TEXT_UNAVAILABLE in LLM-only mode
      return [];
    }

    return pages;
  } catch (e) {
    console.error("[PDF] Text extraction failed:", e.message);
    // Return empty array to trigger PDF_TEXT_UNAVAILABLE in LLM-only mode
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fileUrl, fileName, organizationId } = body;

    // Initialize metaSource and other variables at the top level to avoid scoping issues
    let metaSource: string = "pdf"; // Default source
    let meta: Record<string, unknown> = {};

    console.log('=== PDF EXTRACTION STARTED (LLM-ONLY MODE) ===');
    console.log('Processing file:', { fileName, organizationId, timestamp: new Date().toISOString() });

    // Validate inputs
    if (!fileUrl || !fileName || !organizationId) {
      throw new Error('Missing required parameters: fileUrl, fileName, or organizationId');
    }

    // LLM-only configuration
    const REQUIRE_LLM = (Deno.env.get("REQUIRE_LLM") || "0") === "1";
    const ENABLE_GEMINI_PDF = (Deno.env.get("ENABLE_GEMINI_PDF") || "0") === "1";
    const providersEnabled = (Deno.env.get("PROVIDERS_ENABLED") || "openai,anthropic,google")
      .split(",").map(s => s.trim()).filter(Boolean);

    const hasAnyKey =
      !!Deno.env.get("OPENAI_API_KEY") ||
      !!Deno.env.get("ANTHROPIC_API_KEY") ||
      !!Deno.env.get("GOOGLE_API_KEY");

    console.log('🔑 API Keys Status:', {
      openai: !!Deno.env.get("OPENAI_API_KEY") ? 'configured' : 'missing',
      anthropic: !!Deno.env.get("ANTHROPIC_API_KEY") ? 'configured' : 'missing',
      google: !!Deno.env.get("GOOGLE_API_KEY") ? 'configured' : 'missing'
    });
    
    // Enhanced provider validation with detailed diagnostics
    const rawProvidersEnabled = Deno.env.get("PROVIDERS_ENABLED") || "";
    console.log('📋 Raw PROVIDERS_ENABLED value:', rawProvidersEnabled.length > 50 ? rawProvidersEnabled.substring(0, 50) + "..." : rawProvidersEnabled);
    
    // Check if PROVIDERS_ENABLED contains API keys instead of provider names
    if (/^sk-|^AIza|^ant-/.test(rawProvidersEnabled)) {
      console.error('❌ CRITICAL: PROVIDERS_ENABLED contient une clé API au lieu de noms de providers!');
      console.error('   Format attendu: "openai,anthropic,google"');
      console.error('   Format reçu: clé API détectée');
      console.error('   Action requise: Mettre à jour PROVIDERS_ENABLED avec les noms de providers');
    }
    
    console.log('📋 Providers enabled:', providersEnabled);
    console.log('🎯 REQUIRE_LLM mode:', REQUIRE_LLM;

    if (REQUIRE_LLM && (!providersEnabled.length || !hasAnyKey)) {
      return new Response(JSON.stringify({
        success: false,
        error: "LLM_REQUIRED_BUT_NO_PROVIDER",
        details: "REQUIRE_LLM=1 mais aucun provider activé ou clé absente."
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1) Fetch and extract PDF text for LLM processing
    console.log('=== PDF FETCH PHASE ===');
    console.log('Fetching PDF from URL:', fileUrl);

    const pdfResponse = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Supabase Edge Function PDF Extractor/3.0',
        'Accept': 'application/pdf, application/octet-stream, */*',
      }
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF downloaded successfully: ${Math.round(pdfBuffer.byteLength / 1024)}KB`);

    // 2) Extract text (native + OCR fallback if needed)
    console.log('Starting PDF text extraction with multiple strategies...');
    let pages = await extractPDFSafe(pdfBuffer);
    const lens = pages.map(p => p.text.length);
    const totalChars = pages.reduce((s, p) => s + (p.text?.length || 0), 0);
    
    // Calculate derived values that will be used later
    let totalLength = totalChars;
    let extractedText = pages.map(p => p.text).join('\n');
    
    console.log(`[PDF] Native extraction: pages=${pages.length}, chars=${totalChars}`);

    // OCR fallback if native text is insufficient
    const ENABLE_OCR = (Deno.env.get("ENABLE_OCR") || "1") === "1";
    if (ENABLE_OCR && totalChars < 100) {
      console.warn("[PDF] Almost no native text. Trying OCR fallback...");
      try {
        const ocrPages = await ocrFallbackFromPdf(pdfBuffer);
        const ocrTotal = ocrPages.reduce((sum, p) => sum + p.text.length, 0);
        console.log(`[OCR] Extracted pages=${ocrPages.length}, chars=${ocrTotal}`);
        
        if (ocrTotal >= 100) {
          pages = ocrPages; // Replace with OCR result
          metaSource = "ocr";
          totalLength = ocrTotal;
          extractedText = ocrPages.map(p => p.text).join('\n');
          console.log("✅ Using OCR-extracted text for analysis");
        }
      } catch (e: any) {
        console.error("[OCR] Failed:", e?.message || e);
      }
    }

    // Recalculate after potential OCR
    const finalTotalChars = pages.reduce((s, p) => s + (p.text?.length || 0), 0);
    const textIsWeak = finalTotalChars < 500;

    // Gemini PDF fallback for very weak text (scanned documents)
    if (ENABLE_GEMINI_PDF && textIsWeak && Deno.env.get("GOOGLE_API_KEY")) {
      console.log("🔎 Using Gemini PDF mode (raw file) because text is weak:", finalTotalChars);
      try {
        const googlePdfJson = await callGoogleFromRawPDF(pdfBuffer);
        
        // Validate JSON schema
        let validated;
        try {
          validated = WineProductSpecSchema.parse(googlePdfJson);
          console.log('✅ Gemini PDF spec validation passed');
        } catch (e: any) {
          console.error('❌ Gemini PDF spec validation failed:', e);
          // Continue with regular flow if validation fails
        }

        if (validated) {
          const quality = computeQuality(validated, { citations: validated.citations });
          
          // Persist to database
          try {
            const supabase = createClient(
              Deno.env.get('SUPABASE_URL')!,
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            );

            await supabase
              .from('product_specs')
              .insert({
                organization_id: organizationId,
                filename: fileName,
                spec_json: validated,
                quality_score: quality,
                providers: { runs: [{ provider: "google-pdf", ok: true, ms: 0 }] }
              });

            console.log('✅ Gemini PDF spec persisted to database');
          } catch (dbError: any) {
            console.error('❌ Database error for Gemini PDF:', dbError);
          }

          return new Response(JSON.stringify({
            success: true,
            source: metaSource,
            quality,
            providers: { runs: [{ provider: "google-pdf", ok: true, ms: 0 }] },
            data: validated,
            filename: fileName,
            extractedData: validated,
            metadata: { 
              source: metaSource, 
              totalProviders: 1, 
              successfulProviders: 1, 
              mode: "gemini_pdf" 
            }
          }), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (e: any) {
        console.warn("Gemini PDF mode failed:", e?.message);
        // Continue with regular flow below
      }
    }

      // Final check: if still no usable text after all fallbacks
      if (REQUIRE_LLM && totalLength < 30) {
        return new Response(JSON.stringify({
          success: false,
          error: "EXTRACTION_FAILED",
          details: "Impossible d'extraire du texte exploitable du document après tous les fallbacks (PDF + OCR + Gemini).",
          meta: { source: metaSource, totalLength, pagesProcessed: pages.length }
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    // 3) LLM-only analysis: call orchestrator (no fallback)
    console.log('=== LLM ANALYSIS PHASE ===');
    console.log('🤖 Starting LLM-only orchestration...');

    const { successes, failures, fused } = await runOrchestrator({
      pages,
      maxCharsPerChunk: Number(Deno.env.get("CHUNK_SIZE") || 6000)
    });

    if (!successes.length) {
      return new Response(JSON.stringify({
        success: false,
        error: "ALL_PROVIDERS_FAILED",
        details: failures.map(f => ({
          provider: f.provider,
          status: f.status ?? null,
          code: f.code ?? null,
          message: f.error ?? "unknown"
        }))
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4) Normalize and validate JSON schema
    console.log('=== SPEC NORMALIZATION & VALIDATION PHASE ===');
    
    // First normalize the raw data
    const normalized = normalizeSpec(fused);
    console.log('✅ Spec normalized');

    // Basic hard validation (only critical constraints)
    const hardErrors: string[] = [];
    if (normalized.abv_percent != null && (normalized.abv_percent < 5 || normalized.abv_percent > 75)) {
      hardErrors.push("abv_percent out of range (5–75).");
    }
    if (normalized.vintage != null) {
      const currentYear = new Date().getFullYear() + 1;
      if (normalized.vintage < 1990 || normalized.vintage > currentYear) {
        hardErrors.push(`vintage out of range (1990–${currentYear}).`);
      }
    }

    if (hardErrors.length) {
      console.error('❌ Hard validation failed:', hardErrors);
      return new Response(JSON.stringify({
        success: false,
        error: "SPEC_VALIDATION_FAILED",
        details: hardErrors
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try Zod validation with normalized data (allows soft failures)
    let validated = normalized;
    try {
      validated = WineProductSpecSchema.parse(normalized);
      console.log('✅ Zod validation passed');
    } catch (e: any) {
      console.warn('⚠️ Zod validation failed, continuing with normalized data:', e?.issues?.[0]?.message);
      // Continue with normalized data instead of failing
    }

    // 5) Compute quality score
    const quality = computeQuality(validated, { citations: validated.citations });

    // Adaptive quality assessment with intelligent thresholds
    const activeProviders = successes.length;
    const hasQuotaIssues = failures.some(f => f.code === "rate_limited" || f.code === "billing_issue");
    
    const adjustedQuality = computeQuality(validated, { 
      citations: validated?.citations,
      providers: successes.concat(failures)
    });
    
    console.log(`📊 Quality computed: ${adjustedQuality}% (source: ${metaSource}, providers: ${activeProviders})`);
    
    // Critical fields for wine products (minimum viable extraction)
    const criticalFields = ["productName", "producer", "region", "country"];
    const filledCriticalFields = criticalFields.filter(key => {
      const value = validated[key];
      return value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
    }).length;
    
    // Total filled fields
    const filledFields = Object.keys(validated).filter(key => {
      const value = validated[key];
      return value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
    }).length;
    
    // Adaptive quality thresholds based on context
    let qualityThreshold = 20; // Default
    let minFieldsThreshold = 3; // Default
    
    if (hasQuotaIssues) {
      qualityThreshold = 12; // Reduced for quota constraints
      minFieldsThreshold = 2; // Accept with 2 fields when quotas are limited
      console.log('📉 Using relaxed thresholds due to API quota constraints');
    }
    
    if (activeProviders === 1) {
      qualityThreshold = Math.max(10, qualityThreshold - 5); // Single provider gets easier threshold
      console.log('🔄 Using single-provider threshold adjustment');
    }
    
    // Check if we meet minimum viable extraction criteria
    const hasMinimumViableData = filledCriticalFields >= 1 && filledFields >= minFieldsThreshold;
    const meetsQualityThreshold = adjustedQuality >= qualityThreshold;
    
    if (!meetsQualityThreshold && !hasMinimumViableData) {
      console.log('❌ Spec quality insufficient:', { 
        quality: adjustedQuality, 
        threshold: qualityThreshold,
        filledFields, 
        criticalFields: filledCriticalFields,
        source: metaSource 
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: "LOW_QUALITY_EXTRACTION",
        details: hasQuotaIssues 
          ? `Extraction partielle (${adjustedQuality}%) - Quotas API limités. Réessayez plus tard ou contactez le support.`
          : `Qualité d'extraction insuffisante (${adjustedQuality}%). Le document pourrait nécessiter un traitement manuel.`,
        providers: { runs: failures.concat(successes) },
        qualityScore: adjustedQuality,
        extractionSource: metaSource,
        partialData: hasMinimumViableData ? validated : null,
        meta: { 
          source: metaSource, 
          totalLength, 
          pagesProcessed: pages.length,
          quotaIssues: hasQuotaIssues,
          thresholdUsed: qualityThreshold
        }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('✅ LLM ANALYSIS COMPLETED:', {
      successfulProviders: successes.length,
      failedProviders: failures.length,
      qualityScore: quality,
      extractedFields: Object.keys(validated).length
    });

    // 6) Persist to database
    console.log('=== DATABASE PERSISTENCE ===');
    let insertResult = null;
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: insertData, error: insertError } = await supabase
        .from('product_specs')
        .insert({
          organization_id: organizationId,
          filename: fileName,
          spec_json: validated,
          quality_score: quality,
          providers: { runs: successes.concat(failures) }
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database insert failed:', insertError);
        // Continue anyway - don't fail the extraction for DB issues
      } else {
        insertResult = insertData;
        console.log('✅ Spec persisted to database:', insertResult.id);
      }
    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      // Continue anyway - don't fail the extraction for DB issues
    }

    // 7) Return enriched response for monitoring
    return new Response(JSON.stringify({
      success: true,
      extractedData: validated,
      qualityScore: quality,
      extractionSource: metaSource,
      processingMeta: meta,
      providers: { runs: successes.concat(failures) },
      specId: insertResult?.id,
      extractedText: extractedText.slice(0, 500) + (extractedText.length > 500 ? "..." : ""),
      meta: { source: metaSource, ...meta }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('=== EXTRACTION FAILED ===', e);
    
    const providers = e?.providers || [];
    const detailsStr = Array.isArray(e?.details)
      ? e.details.map((d: any) => `${d.provider}: ${d.code || d.status || ""} ${String(d.error || "")}`).join(" | ")
      : (e?.details || e?.message || "unknown");
    
    return new Response(JSON.stringify({
      success: false,
      error: "ORCHESTRATOR_EXECUTION_FAILED",
      details: detailsStr,           // ⇐ texte lisible pour le toast
      providers: { runs: providers } // ⇐ Monitoring a quelque chose à afficher
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
