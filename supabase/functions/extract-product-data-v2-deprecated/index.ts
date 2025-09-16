import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve((req) => {
  console.log(`🚫 [DEPRECATED] Attempt to use old extract-product-data-v2 endpoint`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  return new Response(
    JSON.stringify({ 
      error: "Endpoint deprecated - use /analyze-pdf-raw for raw AI analysis",
      code: "ENDPOINT_GONE",
      migration: "Please use the new /functions/v1/analyze-pdf-raw endpoint for PDF analysis"
    }), 
    { 
      status: 410, 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      } 
    }
  );
});