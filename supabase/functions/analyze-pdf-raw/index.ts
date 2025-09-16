import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing 'file' (PDF)" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Analyzing PDF: ${file.name} (${Math.round(file.size / 1024)}KB)`);

    // Convert file to base64 for OpenAI vision API
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use OpenAI Chat Completions API with vision capabilities
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Vision model that can process PDFs
        messages: [
          {
            role: 'system',
            content: 'Tu es un moteur d\'analyse. Réponds en TEXTE BRUT, sans markdown, sans mise en forme HTML. Conserve exactement les espaces et les retours à la ligne. Analyse le contenu du PDF et fournis une description détaillée de ce que tu vois.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyse le PDF fourni et décris son contenu en détail :'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API Error: ${response.status}`,
        details: errorText 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content ?? '';

    console.log('✅ Raw text analysis completed');
    
    // Return pure text response
    return new Response(rawText, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain; charset=UTF-8' 
      },
    });

  } catch (error) {
    console.error('❌ Error in analyze-pdf-raw function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});