import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.190.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityCheckRequest {
  user_id: string;
  organization_id: string;
  ip_address: string;
  country?: string;
  city?: string;
  user_agent: string;
  device_fingerprint: string;
  session_token: string;
}

interface ThreatIntelResponse {
  is_malicious: boolean;
  threat_types: string[];
  confidence: number;
  sources: string[];
}

// Générer une empreinte d'appareil basée sur les caractéristiques
function generateDeviceFingerprint(userAgent: string, screenRes?: string, timezone?: string): string {
  const data = `${userAgent}-${screenRes || 'unknown'}-${timezone || 'unknown'}`;
  const encoder = new TextEncoder();
  const hashBuffer = crypto.subtle.digestSync('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vérifier les règles géographiques
async function checkGeographicRules(supabase: any, organizationId: string, country?: string, city?: string): Promise<{allowed: boolean, blockedBy?: string}> {
  const { data: rules, error } = await supabase
    .from('geographic_security_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching geographic rules:', error);
    return { allowed: true }; // Fail open en cas d'erreur
  }

  // Évaluer les règles par priorité
  for (const rule of rules) {
    const { rule_type, rule_value } = rule;
    
    if (rule_type === 'block_country' && country === rule_value) {
      return { allowed: false, blockedBy: `Pays bloqué: ${country}` };
    }
    
    if (rule_type === 'allow_country' && country !== rule_value) {
      // Si on a une règle allow_country et que le pays ne correspond pas
      const otherAllowRules = rules.filter(r => r.rule_type === 'allow_country' && r.rule_value !== rule_value);
      if (otherAllowRules.length === 0 || !otherAllowRules.some(r => r.rule_value === country)) {
        return { allowed: false, blockedBy: `Seuls certains pays sont autorisés` };
      }
    }
    
    // TODO: Implémenter les règles de geofencing avec coordonnées
  }

  return { allowed: true };
}

// Vérifier les menaces dans la base de données
async function checkThreatIntelligence(supabase: any, ipAddress: string): Promise<ThreatIntelResponse> {
  const { data: threat, error } = await supabase
    .from('threat_intelligence')
    .select('*')
    .eq('ip_address', ipAddress)
    .maybeSingle();

  if (error) {
    console.error('Error checking threat intelligence:', error);
    return { is_malicious: false, threat_types: [], confidence: 0, sources: [] };
  }

  if (threat && (threat.expires_at === null || new Date(threat.expires_at) > new Date())) {
    return {
      is_malicious: threat.confidence_score > 70,
      threat_types: [threat.threat_type],
      confidence: threat.confidence_score,
      sources: [threat.source]
    };
  }

  return { is_malicious: false, threat_types: [], confidence: 0, sources: [] };
}

// Vérifier les patterns d'attaque
async function checkAttackPatterns(supabase: any, organizationId: string, userId: string, ipAddress: string, country?: string): Promise<{blocked: boolean, reasons: string[], actionRequired?: string}> {
  const reasons: string[] = [];
  let blocked = false;
  let actionRequired: string | undefined;

  // Récupérer les patterns actifs
  const { data: patterns, error } = await supabase
    .from('attack_patterns')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching attack patterns:', error);
    return { blocked: false, reasons: [] };
  }

  // Récupérer les sessions récentes de l'utilisateur
  const { data: recentSessions } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24h
    .order('last_active', { ascending: false });

  for (const pattern of patterns) {
    const { pattern_type, threshold_config, action_type } = pattern;
    const config = threshold_config as any;

    switch (pattern_type) {
      case 'brute_force':
        // Vérifier les tentatives de connexion répétées
        const recentAttempts = recentSessions?.filter(s => 
          s.ip_address === ipAddress && 
          new Date(s.last_active) > new Date(Date.now() - (config.time_window_minutes * 60 * 1000))
        ).length || 0;
        
        if (recentAttempts >= config.max_attempts) {
          reasons.push(`Trop de tentatives de connexion: ${recentAttempts}/${config.max_attempts}`);
          if (action_type === 'block') blocked = true;
          if (action_type === 'require_mfa') actionRequired = 'mfa';
        }
        break;

      case 'multiple_countries':
        const recentCountries = new Set(
          recentSessions?.filter(s => 
            new Date(s.last_active) > new Date(Date.now() - (config.time_window_hours * 60 * 60 * 1000)) &&
            s.country
          ).map(s => s.country) || []
        );
        
        if (country) recentCountries.add(country);
        
        if (recentCountries.size > config.max_countries) {
          reasons.push(`Connexions depuis trop de pays: ${recentCountries.size}/${config.max_countries}`);
          if (action_type === 'block') blocked = true;
          if (action_type === 'require_mfa') actionRequired = 'mfa';
        }
        break;

      case 'rapid_location_change':
        const lastSession = recentSessions?.[0];
        if (lastSession && lastSession.country && lastSession.country !== country) {
          const timeDiff = Date.now() - new Date(lastSession.last_active).getTime();
          if (timeDiff < config.time_window_minutes * 60 * 1000) {
            reasons.push(`Changement de pays trop rapide: ${lastSession.country} → ${country}`);
            if (action_type === 'alert') actionRequired = 'alert';
            if (action_type === 'require_mfa') actionRequired = 'mfa';
          }
        }
        break;
    }
  }

  return { blocked, reasons, actionRequired };
}

// Gérer les appareils de confiance
async function handleTrustedDevice(supabase: any, userId: string, deviceFingerprint: string, deviceInfo: any): Promise<{isTrusted: boolean, trustScore: number}> {
  const { data: device, error } = await supabase
    .from('trusted_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('device_fingerprint', deviceFingerprint)
    .maybeSingle();

  if (error) {
    console.error('Error checking trusted device:', error);
    return { isTrusted: false, trustScore: 0 };
  }

  if (device) {
    // Mettre à jour la dernière utilisation
    await supabase
      .from('trusted_devices')
      .update({ 
        last_seen: new Date().toISOString(),
        ...deviceInfo 
      })
      .eq('id', device.id);

    return { isTrusted: device.is_trusted, trustScore: device.trust_score };
  }

  // Nouvel appareil - créer une entrée
  const { error: insertError } = await supabase
    .from('trusted_devices')
    .insert({
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      trust_score: 50, // Score initial neutre
      is_trusted: false, // Par défaut non approuvé
      ...deviceInfo
    });

  if (insertError) {
    console.error('Error inserting new device:', insertError);
  }

  return { isTrusted: false, trustScore: 50 };
}

// Créer un incident de sécurité
async function createSecurityIncident(supabase: any, organizationId: string, userId: string, incidentData: any) {
  const { error } = await supabase
    .from('security_incidents')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      incident_type: incidentData.type,
      severity: incidentData.severity,
      source_ip: incidentData.ip,
      country: incidentData.country,
      city: incidentData.city,
      device_info: incidentData.device_info,
      details: incidentData.details
    });

  if (error) {
    console.error('Error creating security incident:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json();
    
    // Extraire et valider les données avec des valeurs par défaut
    const user_id = requestData.user_id || requestData.userId;
    const organization_id = requestData.organization_id || requestData.organizationId;
    const ip_address = requestData.ip_address || requestData.ipAddress || '127.0.0.1';
    const user_agent = requestData.user_agent || requestData.userAgent || 'Unknown';
    const country = requestData.country;
    const city = requestData.city;
    const session_token = requestData.session_token || requestData.sessionToken || 'test-session';
    const device_fingerprint_input = requestData.device_fingerprint || user_agent;

    // Vérifier que les champs obligatoires sont présents
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Intelligent security check for:', { user_id, organization_id, ip_address, country });

    // Générer l'empreinte d'appareil
    const deviceFingerprint = generateDeviceFingerprint(user_agent, device_fingerprint_input);

    // 1. Vérifier les règles géographiques
    const geoCheck = await checkGeographicRules(supabase, organization_id, country, city);
    if (!geoCheck.allowed) {
      await createSecurityIncident(supabase, organization_id, user_id, {
        type: 'geographic_violation',
        severity: 'high',
        ip: ip_address,
        country,
        city,
        device_info: { user_agent, device_fingerprint: deviceFingerprint },
        details: { reason: geoCheck.blockedBy, rule_violated: 'geographic_restriction' }
      });

      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'geographic_violation',
          details: geoCheck.blockedBy,
          action: 'block'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Vérifier la base de données de menaces
    const threatCheck = await checkThreatIntelligence(supabase, ip_address);
    if (threatCheck.is_malicious) {
      await createSecurityIncident(supabase, organization_id, user_id, {
        type: 'threat_intelligence',
        severity: 'critical',
        ip: ip_address,
        country,
        city,
        device_info: { user_agent, device_fingerprint: deviceFingerprint },
        details: { 
          threat_types: threatCheck.threat_types, 
          confidence: threatCheck.confidence,
          sources: threatCheck.sources
        }
      });

      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'threat_detected',
          details: `IP malveillante détectée: ${threatCheck.threat_types.join(', ')}`,
          action: 'block'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Vérifier les patterns d'attaque
    const patternCheck = await checkAttackPatterns(supabase, organization_id, user_id, ip_address, country);
    if (patternCheck.blocked) {
      await createSecurityIncident(supabase, organization_id, user_id, {
        type: 'attack_pattern',
        severity: 'high',
        ip: ip_address,
        country,
        city,
        device_info: { user_agent, device_fingerprint: deviceFingerprint },
        details: { patterns: patternCheck.reasons, action: 'blocked' }
      });

      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'attack_pattern',
          details: patternCheck.reasons.join('; '),
          action: 'block'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Vérifier les appareils de confiance
    const deviceInfo = {
      device_name: `${country || 'Unknown'} Device`,
      device_type: /Mobile|Android|iPhone|iPad/.test(user_agent) ? 'Mobile' : 'Desktop',
      os_details: user_agent,
      browser: user_agent.includes('Chrome') ? 'Chrome' : 
               user_agent.includes('Firefox') ? 'Firefox' :
               user_agent.includes('Safari') ? 'Safari' : 'Other',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    const trustedDevice = await handleTrustedDevice(supabase, user_id, deviceFingerprint, deviceInfo);

    // 5. Calculer le score de risque final
    let riskScore = 0;
    const riskReasons: string[] = [];

    // Ajouter au risque si l'appareil n'est pas de confiance
    if (!trustedDevice.isTrusted) {
      riskScore += 30;
      riskReasons.push('Appareil non approuvé');
    }

    // Ajouter au risque pour les patterns détectés
    if (patternCheck.reasons.length > 0) {
      riskScore += 25;
      riskReasons.push(...patternCheck.reasons);
    }

    // Ajouter au risque pour les menaces de faible confiance
    if (threatCheck.confidence > 30 && threatCheck.confidence <= 70) {
      riskScore += 20;
      riskReasons.push('IP suspecte détectée');
    }

    // Si une action spéciale est requise mais pas de blocage
    let actionRequired = patternCheck.actionRequired;
    if (riskScore > 50 && !trustedDevice.isTrusted && !actionRequired) {
      actionRequired = 'mfa';
    }

    // Enregistrer un incident si le risque est élevé
    if (riskScore > 60) {
      await createSecurityIncident(supabase, organization_id, user_id, {
        type: 'high_risk_login',
        severity: riskScore > 80 ? 'high' : 'medium',
        ip: ip_address,
        country,
        city,
        device_info: { user_agent, device_fingerprint: deviceFingerprint },
        details: { 
          risk_score: riskScore, 
          reasons: riskReasons,
          trusted_device: trustedDevice.isTrusted,
          trust_score: trustedDevice.trustScore
        }
      });
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        risk_score: riskScore,
        risk_reasons: riskReasons,
        trusted_device: trustedDevice.isTrusted,
        trust_score: trustedDevice.trustScore,
        device_fingerprint: deviceFingerprint,
        action_required: actionRequired,
        threat_intel: threatCheck,
        geographic_check: geoCheck
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in intelligent-security:', error);
    
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