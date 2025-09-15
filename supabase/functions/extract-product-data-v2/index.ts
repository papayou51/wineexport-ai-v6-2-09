import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { ProductExtractionSchema, PRODUCT_EXTRACTION_PROMPT } from "../_shared/ai-orchestrator/schemas/product-extraction.ts";
import { normalizeSpec } from "../_shared/spec-normalize.ts";
import { computeQuality } from "../_shared/ai-orchestrator/quality.ts";
import { PDFExtractor } from "../_shared/pdf-extractor.ts";
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

    console.log('=== PDF EXTRACTION V2 STARTED (OpenAI Assistants API) ===');
    console.log('Processing file:', { fileName, organizationId, timestamp: new Date().toISOString() });

    // Validate inputs
    if (!fileUrl || !fileName || !organizationId) {
      throw new Error('Missing required parameters: fileUrl, fileName, or organizationId');
    }

    // Check for OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: "OPENAI_API_KEY_MISSING",
        details: "Clé API OpenAI manquante. Configurez OPENAI_API_KEY dans les secrets."
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
      let modelUsed: string | null = null;
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

      // Fallback to non-strict mode if needed
      if (!useStrictMode) {
        runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            assistant_id: assistantId,
            instructions: PRODUCT_EXTRACTION_PROMPT + "\n\nRETURNER UNIQUEMENT un JSON valide.",
          })
        });

        if (!runResponse.ok) {
          throw new Error(`Failed to create non-strict run: ${await runResponse.text()}`);
        }
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

      // 9) Extract PDF text for evidence verification
      console.log('📄 Extracting PDF text for evidence verification...');
      const pdfExtractionResult = PDFExtractor.extractText(pdfBuffer, fileName);
      const pdfText = pdfExtractionResult.text.toLowerCase();
      console.log(`📄 PDF text extracted: ${pdfExtractionResult.length} chars, strategies: ${pdfExtractionResult.extractionStrategies.join(', ')}`);

      // 10) Parse JSON response
      let rawSpec: any;
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

      // 11) Evidence verification - Remove fields without valid citations
      console.log('🔍 Starting evidence verification...');
      const { extractedData: verifiedSpec, validationReport } = verifyEvidence(rawSpec, pdfText, fileName);
      console.log(`🔍 Evidence verification completed: ${validationReport.keptFields} kept, ${validationReport.droppedFields} dropped`);

      // 12) Normalize & validate extracted data
      const normalized = normalizeSpec(verifiedSpec);
      console.log('✅ Spec normalized');
      
      // Apply basic sanity checks (ChatGPT mode) 
      const { spec: finalSpec, validationLog } = validateBasicFields(normalized);
      
      console.log(`📊 Basic validation results: ${JSON.stringify(validationLog, null, 2)}`);

      // 13) Validate with Zod schema
      let validated = finalSpec;
      try {
        validated = ProductExtractionSchema.parse(finalSpec);
        console.log('✅ Zod validation passed');
      } catch (e: any) {
        console.warn('⚠️ Zod validation failed, using normalized data:', e?.issues?.[0]?.message);
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

      // 15) Save to database
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
            spec_json_metadata: {
              model: modelUsed,
              filename: fileName,
              file_hash: hashHex,
              processingTime: Date.now() - extractionStart,
              validationReport: validationReport,
              extractionStrategies: pdfExtractionResult.extractionStrategies
            },
            quality_score: quality,
            providers: { runs: [{ provider: "openai-assistants", model: modelUsed || "unknown", ok: true, ms: attempts * 1000 }] }
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

      // Success response
      return new Response(JSON.stringify({
        success: true,
        extractedData: validated,
        extractedText: pdfExtractionResult.text.substring(0, 2000) + (pdfExtractionResult.text.length > 2000 ? '...' : ''),
        qualityScore: quality,
        extractionSource: "openai-assistants",
        providers: { runs: [{ provider: "openai-assistants", model: modelUsed || "unknown", ok: true, ms: attempts * 1000 }] },
        specId: insertResult?.id,
        filename: fileName,
        metadata: { 
          model: modelUsed || "unknown",
          source: "openai-assistants",
          version: "v2",
          filename: fileName,
          file_hash: hashHex,
          processingTime: Date.now() - extractionStart,
          validationReport: validationReport,
          extractionStrategies: pdfExtractionResult.extractionStrategies,
          hasWineContent: pdfExtractionResult.hasWineContent,
          processingTimeSeconds: attempts
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } finally {
      // Cleanup OpenAI resources
      console.log('Cleaning up OpenAI resources...');
      
      const cleanupPromises = [];
      
      // Delete file
      if (fileUpload?.id) {
        cleanupPromises.push(
          fetch(`https://api.openai.com/v1/files/${fileUpload.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
            }
          }).catch(e => console.warn('File cleanup failed:', e))
        );
      }

      // Delete assistant
      if (assistantId) {
        cleanupPromises.push(
          fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          }).catch(e => console.warn('Assistant cleanup failed:', e))
        );
      }

      await Promise.all(cleanupPromises);
      console.log('Cleanup completed');
    }

  } catch (error: any) {
    console.error('=== EXTRACTION V2 FAILED ===', error);
    
    // Enhanced error classification
    let errorType = "UNKNOWN_ERROR";
    let errorDetails = error.toString();
    
    if (error.message?.includes('invalid_json_schema') || error.message?.includes('additionalProperties')) {
      errorType = "SCHEMA_VALIDATION_ERROR";
      errorDetails = "Erreur de schéma de sortie IA. Réessayez dans 1 minute.";
    } else if (error.message?.includes('timeout')) {
      errorType = "EXTRACTION_TIMEOUT";
      errorDetails = "Extraction trop lente. Réessayez avec un PDF plus simple.";
    } else if (error.message?.includes('Failed to fetch PDF') || error.message?.includes('404')) {
      errorType = "PDF_ACCESS_ERROR";
      errorDetails = "PDF inaccessible. Vérifiez le fichier et réessayez.";
    } else if (error.message?.includes('API key') || error.message?.includes('unauthorized')) {
      errorType = "API_KEY_ERROR";
      errorDetails = "Problème d'authentification API. Contactez le support.";
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorType,
      details: errorDetails,
      originalError: error.message || "UNKNOWN_ERROR",
      providers: { runs: [{ provider: "openai-assistants", ok: false, error: error.message }] }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});