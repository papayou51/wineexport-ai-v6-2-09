import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { ProductExtractionSchema, PRODUCT_EXTRACTION_PROMPT } from "../_shared/ai-orchestrator/schemas/product-extraction.ts";
import { normalizeSpec } from "../_shared/spec-normalize.ts";
import { computeQuality } from "../_shared/ai-orchestrator/quality.ts";
import { PDFExtractor } from "../_shared/pdf-extractor.ts";
import { callGoogleFromRawPDF } from "../_shared/ai-orchestrator/providers/google-pdf.ts";
import { verifyEvidence } from "./evidence-verification.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Basic validation helper for sanity checks
function validateBasicFields(spec: any): { spec: any, validationLog: Record<string, string> } {
  const log: Record<string, string> = {};
  
  // Basic sanity checks without strict citation requirements
  if (spec.vintage && (typeof spec.vintage !== 'number' || spec.vintage < 1900 || spec.vintage > 2100)) {
    spec.vintage = null;
    log.vintage = "✗ (invalid range: must be 1900-2100)";
  } else if (spec.vintage) {
    log.vintage = "✓ (valid range)";
  }
  
  if (spec.alcohol_percentage && (typeof spec.alcohol_percentage !== 'number' || spec.alcohol_percentage < 5 || spec.alcohol_percentage > 25)) {
    spec.alcohol_percentage = null;
    log.alcohol_percentage = "✗ (invalid range: must be 5-25%)";
  } else if (spec.alcohol_percentage) {
    log.alcohol_percentage = "✓ (valid range)";
  }
  
  if (spec.volume_ml && (typeof spec.volume_ml !== 'number' || spec.volume_ml < 50 || spec.volume_ml > 4000)) {
    spec.volume_ml = null;
    log.volume_ml = "✗ (invalid range: must be 50-4000ml)";
  } else if (spec.volume_ml) {
    log.volume_ml = "✓ (valid range)";
  }
  
  return { spec, validationLog: log };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const extractionStart = Date.now();

  try {
    const body = await req.json();
    const { fileUrl, fileName, organizationId } = body;

  console.log('=== PDF EXTRACTION V2.2 - MODE STRICT 100% IA ===');
  console.log('🔥 STRICT MODE: No fallbacks, no normalization, raw AI only');
  
  const STRICT_AI_MODE = Deno.env.get("STRICT_AI_MODE") === "true" || true; // Always strict for now
  console.log(`🎯 STRICT_AI_MODE: ${STRICT_AI_MODE}`);
  console.log(`🎯 STRICT_AI_MODE: ${STRICT_AI_MODE}`);
    console.log('Processing file:', { fileName, organizationId, timestamp: new Date().toISOString() });

    // Validate inputs
    if (!fileUrl || !fileName || !organizationId) {
      throw new Error('Missing required parameters: fileUrl, fileName, or organizationId');
    }

    // Check available API keys with detailed logging
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('🔑 API Keys availability check:', {
      googleApiKey: googleApiKey ? 'AVAILABLE' : 'NOT_SET',
      openaiApiKey: openaiApiKey ? 'AVAILABLE' : 'NOT_SET',
      googleKeyLength: googleApiKey ? googleApiKey.length : 0,
      openaiKeyLength: openaiApiKey ? openaiApiKey.length : 0
    });
    
    if (!googleApiKey && !openaiApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: "API_KEYS_MISSING",
        details: "Aucune clé API disponible. Configurez GOOGLE_API_KEY ou OPENAI_API_KEY dans les secrets."
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1) Fetch PDF
    console.log('Fetching PDF from URL:', fileUrl);
    const pdfResponse = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Supabase Edge Function PDF Extractor V2/1.0',
        'Accept': 'application/pdf, application/octet-stream, */*',
      }
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF downloaded successfully: ${Math.round(pdfBuffer.byteLength / 1024)}KB`);
    
    let rawSpec: any;
    let provider: string;
    let modelUsed: string | null = null;
    let pdfExtractionResult: any = null;
    
    // Try Google PDF API first (direct analysis)
    console.log('🎯 Google API attempt logic:', {
      hasGoogleKey: !!googleApiKey,
      googleKeyPrefix: googleApiKey ? googleApiKey.substring(0, 8) + '...' : 'none',
      willAttemptGoogle: !!googleApiKey
    });
    
    if (googleApiKey) {
      try {
        console.log('🔎 Attempting Google PDF direct analysis...');
        console.log('🔎 Calling callGoogleFromRawPDF with buffer size:', pdfBuffer.byteLength);
        
        rawSpec = await callGoogleFromRawPDF(pdfBuffer);
        
        provider = 'google-pdf';
        modelUsed = Deno.env.get('GOOGLE_MODEL') || 'gemini-1.5-pro';
        console.log('✅ Google PDF analysis successful');
        console.log('✅ Google rawSpec keys:', Object.keys(rawSpec || {}));
      } catch (error: any) {
        console.error('❌ Google PDF analysis failed - Full error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        if (STRICT_AI_MODE) {
          console.log('🚫 STRICT MODE: Google failed, no fallback allowed');
          
          // Determine specific error type
          let errorCode = 'GOOGLE_API_FAILED';
          if (error.message?.includes('Invalid JSON payload received. Unknown name')) {
            errorCode = 'GOOGLE_FILE_UPLOAD_INVALID_META';
          } else if (error.message?.includes('File Upload Error')) {
            errorCode = 'GOOGLE_FILE_UPLOAD_ERROR';  
          } else if (error.message?.includes('Generation Error')) {
            errorCode = 'GOOGLE_GENERATION_ERROR';
          }
          
          return new Response(JSON.stringify({
            success: false,
            error: errorCode,
            details: `STRICT MODE: Google API failed - ${error.message}`,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (!openaiApiKey) {
          throw new Error(`Google PDF failed and no OpenAI fallback available: ${error.message}`);
        }
        console.log('🔄 Will fallback to OpenAI due to Google error');
      }
    } else {
      console.log('⚠️ Google API key not available, skipping Google PDF analysis');
    }
    
    // Étape 3: Vérification stricte Google - Citations obligatoires
    if (rawSpec && provider === 'google-pdf') {
      console.log('🔍 Verifying Google extraction has citations...');
      
      if (!rawSpec.citations || Object.keys(rawSpec.citations).length === 0) {
        console.log('⚠️ Google extraction missing citations');
        
        if (STRICT_AI_MODE) {
          console.log('🚫 STRICT MODE: No citations found, failing hard');
          return new Response(JSON.stringify({
            success: false,
            error: 'STRICT_NO_CITATIONS',
            details: 'STRICT MODE: Google extraction missing mandatory citations',
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        rawSpec = null; // Reset to try OpenAI
        provider = '';
      } else {
        console.log('✅ Google extraction has citations');
      }
    }
    
    if (!rawSpec && openaiApiKey) {
      console.log('🔄 Using OpenAI Assistants API as fallback...');
      provider = 'openai-assistants';

      // 2) Upload PDF to OpenAI Files API
      console.log('Uploading PDF to OpenAI Files API...');
      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], fileName, { type: 'application/pdf' }));
      formData.append('purpose', 'assistants');
      
      const uploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text();
        console.error('Failed to upload PDF to OpenAI:', uploadError);
        throw new Error(`OpenAI File Upload Error: ${uploadError}`);
      }

      const fileUpload = await uploadResponse.json();
      console.log('PDF uploaded successfully. File ID:', fileUpload.id);

      // Track resources for cleanup
      let assistantId: string | null = null;
      let threadId: string | null = null;

      // JSON schema for OpenAI Structured Outputs (strict mode) - WITH citations and confidence
      const PRODUCT_JSON_SCHEMA = {
        name: "product_spec",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { anyOf: [{ type: "string", minLength: 1, pattern: "^(?!null$|n/a$|—$|nd$|na$)" }, { type: "null" }] },
            category: { anyOf: [{ type: "string", pattern: "^(?!null$|n/a$|—$)" }, { type: "null" }] },
            appellation: { anyOf: [{ type: "string", minLength: 2, pattern: "^(?!null$|n/a$|—$)" }, { type: "null" }] },
            region: { anyOf: [{ type: "string" }, { type: "null" }] },
            country: { anyOf: [{ type: "string" }, { type: "null" }] },
            color: { anyOf: [{ type: "string" }, { type: "null" }] },
            vintage: { anyOf: [{ type: "integer", minimum: 1900, maximum: 2100 }, { type: "null" }] },
            alcohol_percentage: { anyOf: [{ type: "number", minimum: 5, maximum: 25 }, { type: "null" }] },
            volume_ml: { anyOf: [{ type: "integer", minimum: 50, maximum: 4000 }, { type: "null" }] },
            grapes: {
              anyOf: [
                { type: "array", items: { type: "string" } },
                { type: "string" },
                { type: "null" }
              ]
            },
            tasting_notes: { anyOf: [{ type: "string" }, { type: "null" }] },
            technical_specs: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    ph: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
                    acidity_gL: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
                    residual_sugar_gL: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
                    so2_total_mgL: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
                    elevage: { anyOf: [{ type: "string" }, { type: "null" }] },
                    vinification: { anyOf: [{ type: "string" }, { type: "null" }] },
                    ageing: { anyOf: [{ type: "string" }, { type: "null" }] },
                    closure: { anyOf: [{ type: "string" }, { type: "null" }] },
                    sulfites: { anyOf: [{ type: "string" }, { type: "null" }] },
                    serving_temp_C: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
                    yield_HlHa: { anyOf: [{ type: "number" }, { type: "string" }, { type: "null" }] },
                    packaging: { anyOf: [{ type: "string" }, { type: "null" }] },
                    other_specs: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          key: { type: "string" },
                          value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] }
                        },
                        required: ["key", "value"]
                      }
                    }
                  }
                },
                { type: "null" }
              ]
            },
            producer_contact: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { anyOf: [{ type: "string" }, { type: "null" }] },
                    address: { anyOf: [{ type: "string" }, { type: "null" }] },
                    phone: { anyOf: [{ type: "string" }, { type: "null" }] },
                    email: { anyOf: [{ type: "string" }, { type: "null" }] },
                    website: { anyOf: [{ type: "string" }, { type: "null" }] }
                  }
                },
                { type: "null" }
              ]
            },
            certifications: {
              anyOf: [
                { type: "array", items: { type: "string" } },
                { type: "null" }
              ]
            },
            awards: {
              anyOf: [
                { type: "array", items: { type: "string" } },
                { type: "null" }
              ]
            },
            terroir: { anyOf: [{ type: "string" }, { type: "null" }] },
            vine_age: { anyOf: [{ type: "number" }, { type: "null" }] },
            yield_hl_ha: { anyOf: [{ type: "number" }, { type: "null" }] },
            vinification: { anyOf: [{ type: "string" }, { type: "null" }] },
            aging_details: { anyOf: [{ type: "string" }, { type: "null" }] },
            bottling_info: { anyOf: [{ type: "string" }, { type: "null" }] },
            ean_code: { anyOf: [{ type: "string" }, { type: "null" }] },
            packaging_info: { anyOf: [{ type: "string" }, { type: "null" }] },
            availability: { anyOf: [{ type: "string" }, { type: "null" }] },
            citations: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    page: { type: "integer", minimum: 1 },
                    evidence: { type: "string", minLength: 5 }
                  },
                  required: ["page", "evidence"]
                }
              }
            },
            confidence: {
              type: "object",
              additionalProperties: {
                type: "number",
                minimum: 0,
                maximum: 1
              }
            }
          },
          required: ["citations", "confidence"]
        },
        strict: true
      };

      // Compatible models for OpenAI Assistants API with file search
      const COMPATIBLE_MODELS = [
        'gpt-4.1-2025-04-14',
        'gpt-4o-2024-08-06',
        'gpt-4o-mini-2024-07-18',
        'gpt-4-turbo',
        'gpt-4'
      ];

      try {
        // 3) Create Assistant
        let assistantCreated = false;

        for (const model of COMPATIBLE_MODELS) {
          try {
            console.log('Creating assistant with model:', model);
            const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
              },
              body: JSON.stringify({
                name: `Wine Extractor ${Date.now()}`,
                instructions: PRODUCT_EXTRACTION_PROMPT,
                model: model,
                tools: [{ type: 'file_search' }],
              })
            });

            if (!assistantResponse.ok) {
              const error = await assistantResponse.text();
              console.warn(`❌ Model ${model} failed:`, error);
              continue;
            }

            const assistant = await assistantResponse.json();
            assistantId = assistant.id;
            modelUsed = model;
            assistantCreated = true;
            console.log('Assistant created:', assistantId, 'with model:', model);
            break;

          } catch (e: any) {
            console.warn(`❌ Model ${model} error:`, e.message);
            continue;
          }
        }

        if (!assistantCreated || !assistantId) {
          throw new Error('Failed to create assistant with any compatible model');
        }

        // 4) Create Thread
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (!threadResponse.ok) {
          throw new Error(`Failed to create thread: ${await threadResponse.text()}`);
        }

        const thread = await threadResponse.json();
        threadId = thread.id;
        console.log('Thread created:', threadId);

        // 5) Add message with file
        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: 'user',
            content: 'Analyse ce document PDF et extrais toutes les informations du produit selon les instructions.',
            attachments: [
              {
                file_id: fileUpload.id,
                tools: [{ type: 'file_search' }]
              }
            ]
          })
        });

        // 6) Create run with structured output (try strict mode first)
        let runResponse: Response;
        let useStrictMode = true;

        try {
          runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
              assistant_id: assistantId,
              response_format: {
                type: 'json_schema',
                json_schema: PRODUCT_JSON_SCHEMA
              }
            })
          });

          if (!runResponse.ok) {
            const errorText = await runResponse.text();
            if (errorText.includes('invalid_json_schema') || errorText.includes('additionalProperties')) {
              console.log('⚠️ Strict schema rejected, falling back to non-strict mode');
              useStrictMode = false;
            } else {
              throw new Error(`Failed to create run: ${errorText}`);
            }
          }
        } catch (e: any) {
          console.log('⚠️ Strict schema rejected, falling back to non-strict mode');
          useStrictMode = false;
        }

        // STRICT MODE: NO FALLBACK TO NON-STRICT
        if (!useStrictMode) {
          throw new Error('STRICT MODE: Schema must be valid - no fallback allowed');
        }

        const run = await runResponse.json();
        console.log('Run started:', run.id);

        // 7) Poll for completion
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 18; // cap to ~18s to stay within Edge runtime limits

        while (runStatus === 'in_progress' || runStatus === 'queued') {
          attempts++;
          if (attempts > maxAttempts) {
            throw new Error('Run timeout after 60 seconds');
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });

          const statusData = await statusResponse.json();
          runStatus = statusData.status;
          console.log(`Run status: ${runStatus} (${attempts}s)`);
        }

        if (runStatus !== 'completed') {
          throw new Error(`Run failed with status: ${runStatus}`);
        }

        console.log(`Run status: ${runStatus} (${attempts}s)`);

        // 8) Get messages
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        const messagesData = await messagesResponse.json();
        const lastMessage = messagesData.data?.[0];

        if (!lastMessage || !lastMessage.content?.[0]?.text?.value) {
          throw new Error('No response received from assistant');
        }

        const responseText = lastMessage.content[0].text.value;
        console.log('Assistant response received, length:', responseText.length);

        // 9) Parse JSON response
        try {
          rawSpec = JSON.parse(responseText);
          console.log('✅ Successfully processed response');
        } catch (parseError: any) {
          console.error('Failed to parse JSON response:', parseError);
          
          // Try to extract JSON from markdown or mixed content
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              rawSpec = JSON.parse(jsonMatch[0]);
              console.log('✅ Extracted JSON from mixed content');
            } catch (e2) {
              throw new Error(`Failed to parse extracted JSON: ${e2.message}`);
            }
          } else {
            throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
          }
        }

        // Cleanup OpenAI resources
        try {
          if (fileUpload?.id) {
            fetch(`https://api.openai.com/v1/files/${fileUpload.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${openaiApiKey}` }
            }).catch(() => {});
          }
          if (assistantId) {
            fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'OpenAI-Beta': 'assistants=v2' }
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('Cleanup warning:', e);
        }

      } catch (openaiError: any) {
        // Cleanup on error
        try {
          if (fileUpload?.id) {
            fetch(`https://api.openai.com/v1/files/${fileUpload.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${openaiApiKey}` }
            }).catch(() => {});
          }
          if (assistantId) {
            fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'OpenAI-Beta': 'assistants=v2' }
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('Cleanup warning:', e);
        }
        throw openaiError;
      }
    }
    
    if (!rawSpec) {
      throw new Error('No extraction result from any provider');
    }
    
    // Determine verification approach based on provider
    let verifiedSpec: any;
    let validationReport: any;
    
    if (provider === 'google-pdf') {
      // Google PDF provides direct analysis - skip evidence verification
      console.log('📋 Using Google PDF results directly (no evidence verification needed)');
      verifiedSpec = rawSpec;
      validationReport = {
        keptFields: Object.keys(rawSpec).filter(k => rawSpec[k] !== null && k !== 'citations' && k !== 'confidence').length,
        droppedFields: 0,
        noCitationFields: [],
        invalidEvidenceFields: [],
        provider: 'google-pdf',
        directAnalysis: true
      };
    } else {
      // OpenAI results need evidence verification
      console.log('📄 Extracting PDF text for evidence verification...');
      pdfExtractionResult = PDFExtractor.extractText(pdfBuffer, fileName);
      const pdfText = pdfExtractionResult.text.toLowerCase();
      console.log(`📄 PDF text extracted: ${pdfExtractionResult.length} chars, strategies: ${pdfExtractionResult.extractionStrategies.join(', ')}`);
      
      console.log('🔍 Starting evidence verification...');
    // 11) STRICT MODE: Evidence verification MANDATORY with STRICT mode only
    let verifiedSpec = rawSpec;
    let validationReport: any = { keptFields: 0, droppedFields: 0 };
    
    if (provider === 'openai-assistants' && pdfExtractionResult?.text) {
      const verification = verifyEvidence(rawSpec, pdfExtractionResult.text, fileName, { mode: 'strict' });
      verifiedSpec = verification.verifiedSpec;
      validationReport = verification.validationReport;
      validationReport.provider = 'openai-assistants';
      console.log(`✅ STRICT evidence verification: ${validationReport.keptFields} kept, ${validationReport.droppedFields} dropped`);
    } else if (provider === 'google-pdf') {
      // Google PDF: Check for citations, fail if none
      if (!rawSpec.citations || Object.keys(rawSpec.citations).length === 0) {
        throw new Error('STRICT MODE: Google PDF extraction must provide citations for evidence');
      }
      Object.keys(rawSpec).forEach(key => {
        if (rawSpec[key] !== null && rawSpec[key] !== undefined && key !== 'citations' && key !== 'confidence') {
          validationReport.keptFields++;
        }
      });
      console.log('✅ Google PDF citations verified in strict mode');
    }
    }

    // 12) STRICT MODE: NO NORMALIZATION - Use raw verified data only
    console.log('🔥 STRICT MODE: Skipping normalizeSpec and basicValidation');
    
    // 13) STRICT MODE: Zod validation MUST pass - fail hard if not
    let validated;
    try {
      validated = ProductExtractionSchema.parse(verifiedSpec);
      console.log('✅ STRICT Zod validation passed');
    } catch (e: any) {
      console.error('❌ STRICT MODE: Zod validation FAILED - no fallback allowed');
      throw new Error(`STRICT MODE: Validation failed - ${e?.issues?.[0]?.message || e.message}`);
    }

    // 14) Compute quality with citation metadata
    const quality = computeQuality(validated, { citations: verifiedSpec.citations || {} });
    console.log(`📊 Quality computed: ${quality}%`);

    // Calculate file hash for traceability
    const fileHash = await crypto.subtle.digest('SHA-256', pdfBuffer);
    const hashArray = Array.from(new Uint8Array(fileHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`🔐 File hash: ${hashHex.substring(0, 16)}...`);
    console.log(`📊 Validation report: kept=${validationReport.keptFields}, dropped=${validationReport.droppedFields}`);

    // 15) Save to database (with time budget check)
    console.log('=== DATABASE PERSISTENCE ===');
    let insertResult = null;
    const extractionDuration = Date.now() - extractionStart;
    
    // Check if we have time left for DB operation (leave 2s buffer)
    if (extractionDuration < 18000) {
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
            normalized_spec: validated,
            metadata: {
              provider: provider,
              model: modelUsed,
              file_hash: hashHex,
              processingTime: extractionDuration,
              validationReport: validationReport,
              extractionStrategies: provider === 'openai-assistants' ? pdfExtractionResult?.extractionStrategies : ['google-pdf'],
              directAnalysis: provider === 'google-pdf'
            },
            quality_score: quality,
            providers: { runs: [{ provider: provider, model: modelUsed || "unknown", ok: true, ms: extractionDuration }] }
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Database insert failed:', insertError);
        } else {
          insertResult = insertData;
          console.log('✅ Spec persisted to database:', insertResult.id);
        }
      } catch (dbError: any) {
        console.error('❌ Database error:', dbError);
      }
    } else {
      console.warn('⚠️ Skipping DB insert - approaching timeout limit');
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      extractedData: validated,
      extractedText: provider === 'google-pdf' ? 'Direct PDF analysis (no text extraction)' : pdfExtractionResult?.text?.substring(0, 2000) + (pdfExtractionResult?.text?.length > 2000 ? '...' : ''),
      qualityScore: quality,
      extractionSource: provider,
      providers: { runs: [{ provider: provider, model: modelUsed || "unknown", ok: true, ms: extractionDuration }] },
      specId: insertResult?.id,
      filename: fileName,
      metadata: {
        extractionDuration: extractionDuration,
        provider: provider,
        model: modelUsed,
        validationReport: validationReport,
        fileHash: hashHex,
        rawExtractedData: rawSpec,
        timestamp: new Date().toISOString(),
        directAnalysis: provider === 'google-pdf'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Extraction error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.name || 'EXTRACTION_ERROR',
      details: error.message,
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - extractionStart
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});