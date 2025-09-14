import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { ProductExtractionSchema, PRODUCT_EXTRACTION_PROMPT } from "../_shared/ai-orchestrator/schemas/product-extraction.ts";
import { normalizeSpec } from "../_shared/spec-normalize.ts";
import { computeQuality } from "../_shared/ai-orchestrator/quality.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    // JSON schema for OpenAI Structured Outputs (strict mode)
    const PRODUCT_JSON_SCHEMA = {
      name: "product_spec",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { anyOf: [{ type: "string", minLength: 1 }, { type: "null" }] },
          appellation: { anyOf: [{ type: "string", minLength: 2 }, { type: "null" }] },
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
            additionalProperties: false,
            properties: {
              name: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              appellation: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              region: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              country: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              color: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              vintage: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              alcohol_percentage: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              volume_ml: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              grapes: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              tasting_notes: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              technical_specs: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              terroir: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              vine_age: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              yield_hl_ha: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              vinification: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              aging_details: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              bottling_info: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              ean_code: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              packaging_info: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } },
              availability: { type: "array", items: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 1 }, evidence: { type: "string" } }, required: ["page", "evidence"] } }
            }
          }
        },
        required: ["name", "appellation", "region", "country", "color", "vintage", "alcohol_percentage", "volume_ml", "grapes", "tasting_notes", "technical_specs", "producer_contact", "certifications", "awards", "terroir", "vine_age", "yield_hl_ha", "vinification", "aging_details", "bottling_info", "ean_code", "packaging_info", "availability", "citations"]
      },
      strict: true
    } as const;
    try {
      // 3) Create assistant with compatible Assistants models (fallback)
      const candidateModels = [
        "gpt-4.1-2025-04-14",
        "o4-mini-2025-04-16",
        "gpt-4o-mini"
      ];
      let modelUsed: string | null = null;

      for (const m of candidateModels) {
        console.log('Creating assistant with model:', m);
        const resp = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            name: 'Expert French Wine Technical Sheet Analyzer',
            instructions: PRODUCT_EXTRACTION_PROMPT,
            model: m,
            tools: [{ type: 'file_search' }],
          }),
        });

        if (resp.ok) {
          const assistant = await resp.json();
          assistantId = assistant.id;
          modelUsed = m;
          console.log('Assistant created:', assistantId, 'with model:', modelUsed);
          break;
        } else {
          const errText = await resp.text();
          console.error('Failed to create assistant with', m, ':', errText);
          try {
            const errJson = JSON.parse(errText);
            const code = errJson?.error?.code;
            const message = errJson?.error?.message || '';
            if (code === 'unsupported_model' || message.includes('cannot be used with the Assistants API')) {
              continue; // try next model
            }
          } catch (_e) {}
          throw new Error(`Assistant Creation Error: ${errText}`);
        }
      }

      if (!assistantId || !modelUsed) {
        throw new Error('NO_SUPPORTED_ASSISTANTS_MODEL: Aucun modèle compatible avec l’API Assistants n’a été trouvé.');
      }

      // 4) Create thread
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({}),
      });

      if (!threadResponse.ok) {
        const threadError = await threadResponse.text();
        console.error('Failed to create thread:', threadError);
        throw new Error(`Thread Creation Error: ${threadError}`);
      }

      const thread = await threadResponse.json();
      threadId = thread.id;
      console.log('Thread created:', threadId);

      // 5) Add message with file
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          role: 'user',
          content: `Extraction structurée de fiche technique (PDF: ${fileName}).

Exigences:
- Ne JAMAIS inventer ni déduire. Si une information n'est pas explicitement lisible dans le PDF, mettre null.
- Citer les sources: remplir "citations" avec, pour chaque champ extrait, une liste d'objets {page, evidence} où "evidence" est un court extrait textuel exact.
- Interdire l'usage du nom de fichier comme source; ne jamais le citer dans "citations".
- Millésime: entier [1900..2100] uniquement si clairement présent (p. ex. "Millésime 2021"). Sinon null.
- Appellation: AOP/AOC/IGP/VDP/etc. uniquement si explicitement mentionnée. Sinon null.
- Degré alcool (% vol): nombre [5..25], convertir "13,5%" -> 13.5. Sinon null.
- Volume: en millilitres (ml). Si plusieurs formats, choisir 750 si explicitement indiqué; sinon null.
- Grapes/Cépages: liste de chaînes; séparer par virgule/puces.
- Tasting notes/notes de dégustation: texte exact; pas d'invention.
- technical_specs: inclure pH, acidité totale, SO2, sucre résiduel, élevage, etc. si présents.
- country par défaut "France" uniquement si le document est manifestement français, sinon null.

Sortie: retourner UNIQUEMENT un JSON valide (pas de texte avant/après) avec des clés en snake_case cohérentes avec:
{name, appellation, region, country, color, vintage, alcohol_percentage, volume_ml, grapes, tasting_notes, technical_specs, producer_contact, certifications, awards, terroir, vine_age, yield_hl_ha, vinification, aging_details, bottling_info, ean_code, packaging_info, availability, citations}.`,
          attachments: [
            {
              file_id: fileUpload.id,
              tools: [{ type: 'file_search' }],
            },
          ],
        }),
      });

      if (!messageResponse.ok) {
        const messageError = await messageResponse.text();
        console.error('Failed to create message:', messageError);
        throw new Error(`Message Creation Error: ${messageError}`);
      }

      // 6) Run assistant with fallback for schema issues
      let runResponse;
      let useStrictSchema = true;
      
      try {
        runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            assistant_id: assistantId,
            response_format: { type: 'json_schema', json_schema: PRODUCT_JSON_SCHEMA },
          }),
        });
        
        // If schema is rejected, try fallback without strict mode
        if (!runResponse.ok) {
          const errorText = await runResponse.text();
          if (errorText.includes('additionalProperties') || errorText.includes('invalid_json_schema')) {
            console.log('⚠️ Strict schema rejected, falling back to non-strict mode');
            useStrictSchema = false;
            
            const fallbackSchema = { ...PRODUCT_JSON_SCHEMA };
            fallbackSchema.strict = false;
            
            runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
              },
              body: JSON.stringify({
                assistant_id: assistantId,
                response_format: { type: 'json_schema', json_schema: fallbackSchema },
              }),
            });
          }
        }
      } catch (schemaError: any) {
        console.error('Schema error, trying without structured output:', schemaError);
        useStrictSchema = false;
        
        runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            assistant_id: assistantId,
          }),
        });
      }

      if (!runResponse.ok) {
        const runError = await runResponse.text();
        console.error('Failed to start run:', runError);
        throw new Error(`Run Start Error: ${runError}`);
      }

      const run = await runResponse.json();
      console.log('Run started:', run.id);

      // 7) Wait for completion
      let runStatus = run.status;
      let attempts = 0;
      const maxAttempts = 90; // 90 seconds max for complex PDFs

      while (runStatus === 'queued' || runStatus === 'in_progress') {
        if (attempts >= maxAttempts) {
          throw new Error('Assistant run timeout after 90 seconds');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.status;
          console.log(`Run status: ${runStatus} (${attempts}s)`);
        }
      }

      if (runStatus !== 'completed') {
        throw new Error(`Assistant run failed with status: ${runStatus}`);
      }

      // 8) Get response
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!messagesResponse.ok) {
        throw new Error('Failed to get messages');
      }

      const messages = await messagesResponse.json();
      const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
      
      if (!assistantMessage || !assistantMessage.content?.[0]?.text?.value) {
        throw new Error('No response from assistant');
      }

      const rawResponse = assistantMessage.content[0].text.value;
      console.log('Assistant response received, length:', rawResponse.length);

      // 9) Parse JSON response with robust fallback
      let extractedData;
      try {
        // Clean response to extract JSON
        let cleanResponse = rawResponse.trim();
        
        // Check if response starts with French text (error case)
        const lowerResponse = cleanResponse.toLowerCase();
        if (lowerResponse.startsWith('je ne peux') || 
            lowerResponse.startsWith('aucune') || 
            lowerResponse.startsWith('désolé') ||
            lowerResponse.includes('impossible') ||
            !cleanResponse.includes('{')) {
          console.warn('⚠️ Assistant returned French text instead of JSON, using fallback');
          console.log('Non-JSON response:', rawResponse.substring(0, 200));
          
          // Return minimal valid JSON structure
          extractedData = {
            productName: null,
            producer: null,
            brand: null,
            appellation: null,
            region: null,
            country: "France",
            color: null,
            vintage: null,
            grapes: null,
            abv_percent: null,
            volume_ml: 750,
            tastingNotes: null,
            foodPairing: null,
            servingTemp_C: null,
            ageingPotential_years: null,
            organicCert: null,
            awards: null
          };
        } else {
          // Find JSON boundaries
          const jsonStart = cleanResponse.indexOf('{');
          const jsonEnd = cleanResponse.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            cleanResponse = cleanResponse.slice(jsonStart, jsonEnd + 1);
          }
          
          extractedData = JSON.parse(cleanResponse);
        }
        
        console.log('✅ Successfully processed response');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.log('Raw response sample:', rawResponse.substring(0, 300));
        
        // Fallback to minimal structure instead of throwing
        console.warn('⚠️ Using fallback JSON structure due to parsing error');
        extractedData = {
          productName: null,
          producer: null,
          brand: null,
          appellation: null,
          region: null,
          country: "France",
          color: null,
          vintage: null,
          grapes: null,
          abv_percent: null,
          volume_ml: 750,
          tastingNotes: null,
          foodPairing: null,
          servingTemp_C: null,
          ageingPotential_years: null,
          organicCert: null,
          awards: null
        };
      }

      // 10) Normalize, enforce citations and sanity checks
      let normalized = normalizeSpec(extractedData);
      console.log('✅ Spec normalized');
      // Log citations count for monitoring
      try {
        const c = (normalized as any)?.citations || {};
        const counts = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Array.isArray(v) ? (v as any[]).length : 0]));
        console.log('🔎 Citations per field:', counts);
      } catch (_e) {}

      // Log terroir fields presence for monitoring
      try {
        const terroir_fields = ['terroir', 'vine_age', 'yield_hl_ha', 'vinification', 'aging_details', 'bottling_info', 'ean_code', 'packaging_info', 'availability'];
        const terroir_presence = Object.fromEntries(terroir_fields.map(f => [f, (normalized as any)?.[f] ? '✓' : '✗']));
        console.log('🌿 Terroir & Production fields:', terroir_presence);
      } catch (_e) {}

      // Enforce evidence-backed critical fields
      const criticalFields = ['vintage', 'alcohol_percentage', 'volume_ml', 'appellation'];
      const hasCitation = (field: string) => {
        try {
          const c = (normalized as any)?.citations?.[field];
          return Array.isArray(c) && c.length > 0;
        } catch { return false; }
      };

      for (const f of criticalFields) {
        if (!hasCitation(f)) {
          (normalized as any)[f] = null;
        }
      }

      // Sanity constraints
      const v = (normalized as any).vintage;
      if (typeof v === 'number' && (v < 1900 || v > 2100)) (normalized as any).vintage = null;

      const abv = (normalized as any).alcohol_percentage ?? (normalized as any).abv_percent;
      if (typeof abv === 'number') {
        if (abv < 5 || abv > 25) (normalized as any).alcohol_percentage = null;
        else (normalized as any).alcohol_percentage = abv;
      }

      const vol = (normalized as any).volume_ml;
      if (typeof vol === 'number') {
        if (vol < 50 || vol > 4000) (normalized as any).volume_ml = null;
      }

      let validated = normalized;
      try {
        validated = ProductExtractionSchema.parse(normalized);
        console.log('✅ Zod validation passed');
      } catch (e: any) {
        console.warn('⚠️ Zod validation failed, using normalized data:', e?.issues?.[0]?.message);
      }

      // 11) Compute quality
      const quality = computeQuality(validated, { citations: (validated as any).citations });
      console.log(`📊 Quality computed: ${quality}%`);

      // 12) Save to database
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
        qualityScore: quality,
        extractionSource: "openai-assistants",
        providers: { runs: [{ provider: "openai-assistants", model: modelUsed || "unknown", ok: true, ms: attempts * 1000 }] },
        specId: insertResult?.id,
        filename: fileName,
        metadata: { 
          model: modelUsed || "unknown",
          source: "openai-assistants",
          version: "v2",
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
      cleanupPromises.push(
        fetch(`https://api.openai.com/v1/files/${fileUpload.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${openaiApiKey}` },
        }).catch(e => console.error('File cleanup failed:', e))
      );
      
      // Delete assistant
      if (assistantId) {
        cleanupPromises.push(
          fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
            method: 'DELETE',
            headers: { 
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          }).catch(e => console.error('Assistant cleanup failed:', e))
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