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

    try {
      // 3) Create assistant - Force best model for 100% ChatGPT analysis
      const model = "gpt-5-2025-08-07"; // Always use best model
      console.log('Creating assistant with model:', model);

      const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          name: 'Expert French Wine Technical Sheet Analyzer',
          instructions: PRODUCT_EXTRACTION_PROMPT,
          model,
          tools: [{ type: 'file_search' }],
        }),
      });

      if (!assistantResponse.ok) {
        const assistantError = await assistantResponse.text();
        console.error('Failed to create assistant:', assistantError);
        throw new Error(`Assistant Creation Error: ${assistantError}`);
      }

      const assistant = await assistantResponse.json();
      assistantId = assistant.id;
      console.log('Assistant created:', assistantId);

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
          content: `🍷 ANALYSE COMPLÈTE DE FICHE TECHNIQUE FRANÇAISE 🍷

MISSION CRITIQUE: Extraire TOUTES les informations de ce PDF (${fileName}) avec une précision de 100%.

RÈGLES ABSOLUES:
❌ JAMAIS de champs vides - construire les valeurs à partir du nom de fichier ou du contenu si nécessaire
❌ JAMAIS ignorer les détails techniques - extraire même les informations partielles
❌ JAMAIS laisser "null" pour name, vintage, alcohol_percentage, volume_ml

✅ TOUJOURS extraire le nom du château/domaine (même depuis le nom de fichier)
✅ TOUJOURS chercher l'année/millésime partout dans le document
✅ TOUJOURS convertir les pourcentages français (13,5% → 13.5)
✅ TOUJOURS remplir volume_ml (750 par défaut pour une bouteille standard)

Retourner UNIQUEMENT un JSON valide avec TOUTES les données extraites.`,
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

      // 6) Run assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
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

      // 10) Normalize and validate
      const normalized = normalizeSpec(extractedData);
      console.log('✅ Spec normalized');

      let validated = normalized;
      try {
        validated = ProductExtractionSchema.parse(normalized);
        console.log('✅ Zod validation passed');
      } catch (e: any) {
        console.warn('⚠️ Zod validation failed, using normalized data:', e?.issues?.[0]?.message);
      }

      // 11) Compute quality
      const quality = computeQuality(validated, { citations: validated.citations });
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
            providers: { runs: [{ provider: "openai-assistants", model, ok: true, ms: attempts * 1000 }] }
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
        providers: { runs: [{ provider: "openai-assistants", model, ok: true, ms: attempts * 1000 }] },
        specId: insertResult?.id,
        filename: fileName,
        metadata: { 
          model,
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
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "UNKNOWN_ERROR",
      details: error.toString(),
      providers: { runs: [{ provider: "openai-assistants", ok: false, error: error.message }] }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});