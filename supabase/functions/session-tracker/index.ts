import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface pour les données de géolocalisation
interface LocationData {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  proxy?: boolean;
  hosting?: boolean;
}

// Interface pour les données enrichies de session
interface SessionEnrichmentData {
  user_agent: string;
  ip_address?: string;
  session_token: string;
  user_id: string;
}

// Fonction pour obtenir les informations de géolocalisation
async function getLocationData(ip: string): Promise<LocationData> {
  try {
    // Utiliser ip-api.com (gratuit, 1000 requests/hour)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone,lat,lon,isp,proxy,hosting`);
    
    if (!response.ok) {
      console.warn('Failed to fetch location data:', response.statusText);
      return {};
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.warn('Location API error:', data.message);
      return {};
    }
    
    return {
      country: data.country,
      city: data.city,
      region: data.regionName,
      timezone: data.timezone,
      lat: data.lat,
      lon: data.lon,
      isp: data.isp,
      proxy: data.proxy || data.hosting,
      hosting: data.hosting
    };
  } catch (error) {
    console.error('Error fetching location data:', error);
    return {};
  }
}

// Fonction pour détecter les détails de l'OS
function getOSDetails(userAgent: string): string {
  if (userAgent.includes('Windows NT')) {
    const version = userAgent.match(/Windows NT ([\d.]+)/)?.[1];
    return `Windows ${version}`;
  }
  if (userAgent.includes('Mac OS X')) {
    const version = userAgent.match(/Mac OS X ([\d._]+)/)?.[1]?.replace(/_/g, '.');
    return `macOS ${version}`;
  }
  if (userAgent.includes('Android')) {
    const version = userAgent.match(/Android ([\d.]+)/)?.[1];
    return `Android ${version}`;
  }
  if (userAgent.includes('iPhone OS')) {
    const version = userAgent.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, '.');
    return `iOS ${version}`;
  }
  if (userAgent.includes('Linux')) {
    return 'Linux';
  }
  return 'Unknown OS';
}

// Fonction pour calculer le score de risque
function calculateRiskScore(
  locationData: LocationData,
  osDetails: string,
  previousSessions: any[],
  userAgent: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Vérifier si c'est un proxy/VPN/hosting
  if (locationData.proxy || locationData.hosting) {
    score += 30;
    reasons.push('Connexion via proxy/VPN détectée');
  }
  
  // Vérifier les connexions simultanées
  const activeSessions = previousSessions.filter(s => 
    new Date(s.last_active).getTime() > Date.now() - 30 * 60 * 1000 // Actif dans les 30 dernières minutes
  );
  
  if (activeSessions.length > 3) {
    score += 25;
    reasons.push('Trop de sessions simultanées');
  }
  
  // Vérifier les changements géographiques rapides
  const recentSessions = previousSessions
    .filter(s => new Date(s.last_active).getTime() > Date.now() - 2 * 60 * 60 * 1000) // 2h
    .filter(s => s.country && s.country !== locationData.country);
    
  if (recentSessions.length > 0) {
    score += 40;
    reasons.push(`Changement géographique rapide (${recentSessions[0].country} → ${locationData.country})`);
  }
  
  // Nouveau pays jamais vu
  const countryHistory = previousSessions.map(s => s.country).filter(Boolean);
  if (locationData.country && !countryHistory.includes(locationData.country)) {
    score += 20;
    reasons.push('Connexion depuis un nouveau pays');
  }
  
  // User-Agent suspect
  if (!userAgent.includes('Mozilla') || userAgent.length < 50) {
    score += 15;
    reasons.push('User-Agent suspect');
  }
  
  return { score: Math.min(score, 100), reasons };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parser la requête
    const requestData = await req.json();
    const { user_agent, ip_address, session_token, user_id }: SessionEnrichmentData = requestData;
    
    if (!user_agent || !session_token || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error('Invalid user_id UUID format:', user_id);
      return new Response(
        JSON.stringify({ error: 'Invalid user_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate session_token format (should also be UUID typically)
    if (session_token.length < 10) {
      console.error('Invalid session_token format:', session_token);
      return new Response(
        JSON.stringify({ error: 'Invalid session_token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtenir l'adresse IP réelle
    const clientIP = ip_address || req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 'unknown';
    
    console.log('Processing session for user:', user_id, 'IP:', clientIP);
    
    // Obtenir les données de géolocalisation avec fallback gracieux
    let locationData: LocationData = {};
    try {
      locationData = await getLocationData(clientIP);
    } catch (geoError) {
      console.warn('Geolocation enrichment failed, continuing without it:', geoError);
      // Continue with empty location data instead of failing completely
    }
    
    // Obtenir les détails de l'OS
    const osDetails = getOSDetails(user_agent);
    
    // Obtenir l'historique des sessions pour ce user
    const { data: previousSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user_id)
      .order('last_active', { ascending: false })
      .limit(50);
    
    if (sessionsError) {
      console.error('Error fetching previous sessions:', sessionsError);
    }
    
    // Calculer le score de risque
    const { score: riskScore, reasons } = calculateRiskScore(
      locationData,
      osDetails,
      previousSessions || [],
      user_agent
    );
    
    // Déterminer le type de connexion
    let connectionType = 'direct';
    if (locationData.proxy) connectionType = 'proxy';
    if (locationData.hosting) connectionType = 'hosting';
    
    // Mettre à jour les IPs précédentes
    const currentSession = previousSessions?.find(s => s.session_token === session_token);
    const previousIps = currentSession?.previous_ips || [];
    if (clientIP !== 'unknown' && !previousIps.includes(clientIP)) {
      previousIps.push(clientIP);
      // Garder seulement les 10 dernières IPs
      if (previousIps.length > 10) {
        previousIps.shift();
      }
    }
    
    // Données enrichies pour la session
    const enrichedData = {
      country: locationData.country,
      city: locationData.city,
      region: locationData.region,
      timezone: locationData.timezone,
      os_details: osDetails,
      risk_score: riskScore,
      is_suspicious: riskScore > 50,
      connection_type: connectionType,
      previous_ips: previousIps,
      ip_address: clientIP,
      last_active: new Date().toISOString()
    };
    
    // Mettre à jour la session dans la base de données avec validation UUID
    try {
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update(enrichedData)
        .eq('session_token', session_token)
        .eq('user_id', user_id);
      
      if (updateError) {
        console.error('Error updating session:', updateError);
        
        // Specific error handling for UUID issues
        if (updateError.message.includes('invalid input syntax for type uuid')) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid UUID format in session data', 
              details: 'Session token or user ID format is invalid' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to update session', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Si la session est suspecte, envoyer une notification
    if (riskScore > 70) {
      console.log('High-risk session detected, sending notification...');
      
      try {
        await supabase.functions.invoke('security-notifications', {
          body: {
            userEmail: 'user-email-placeholder', // À remplacer par l'email réel
            notificationType: 'suspicious_login',
            metadata: {
              location: `${locationData.city}, ${locationData.country}`,
              riskScore,
              reasons: reasons.join(', '),
              ip: clientIP,
              device: osDetails,
              connectionType,
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send security notification:', notificationError);
        // Ne pas faire échouer la requête pour une erreur de notification
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        enrichedData,
        riskScore,
        reasons,
        locationData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error in session-tracker:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});