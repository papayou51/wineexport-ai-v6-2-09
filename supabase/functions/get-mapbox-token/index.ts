import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the Mapbox token from environment variables (Supabase Edge Function Secrets)
    const mapboxToken = Deno.env.get('MAPBOX_TOKEN')
    
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Token Mapbox non configuré',
          message: 'Veuillez configurer le token MAPBOX_TOKEN dans les secrets Supabase'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ token: mapboxToken }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error getting Mapbox token:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})