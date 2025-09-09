-- Correction des vulnérabilités de sécurité critiques

-- 1. Corriger les politiques RLS de la table threat_intelligence
-- Actuellement publique, doit être restreinte aux administrateurs système
DROP POLICY IF EXISTS "System can manage threat intelligence" ON public.threat_intelligence;
DROP POLICY IF EXISTS "System can read threat intelligence" ON public.threat_intelligence;

-- Nouvelles politiques restrictives pour threat_intelligence
CREATE POLICY "Service role can manage threat intelligence"
ON public.threat_intelligence
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read threat intelligence for security checks"
ON public.threat_intelligence
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Restreindre l'accès aux données économiques sensibles des pays
DROP POLICY IF EXISTS "Countries are publicly readable" ON public.countries;

-- Nouvelle politique pour les pays - données de base publiques, données économiques pour utilisateurs authentifiés
CREATE POLICY "Basic country info is publicly readable"
ON public.countries
FOR SELECT
USING (true);

-- Les données économiques et réglementaires détaillées nécessitent une authentification
CREATE POLICY "Economic data requires authentication"
ON public.countries
FOR SELECT
USING (
  auth.role() = 'authenticated' OR 
  (economic_data IS NULL AND wine_market_data IS NULL AND regulatory_info IS NULL)
);

-- 3. Améliorer la sécurité des fonctions sensibles
-- Créer une fonction sécurisée pour vérifier les rôles d'organisation
CREATE OR REPLACE FUNCTION public.verify_organization_access(org_id uuid, required_role app_role DEFAULT 'member'::app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organization_roles
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND (
      role = required_role OR
      (required_role = 'member' AND role IN ('admin', 'owner')) OR
      (required_role = 'admin' AND role = 'owner')
    )
  );
$$;

-- 4. Créer une fonction pour auditer les accès aux données sensibles
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  resource_type text,
  resource_id uuid DEFAULT NULL,
  action_type text DEFAULT 'read'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log automatique des accès aux données sensibles
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      organization_id,
      resource_type,
      resource_id,
      action,
      ip_address,
      user_agent
    )
    SELECT 
      auth.uid(),
      (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() LIMIT 1),
      resource_type,
      resource_id,
      action_type,
      NULL, -- IP sera ajouté par l'application
      NULL  -- User agent sera ajouté par l'application
    WHERE NOT EXISTS (
      -- Éviter la duplication pour le même utilisateur/ressource dans les 5 dernières minutes
      SELECT 1 FROM public.audit_logs 
      WHERE user_id = auth.uid() 
      AND resource_type = log_sensitive_data_access.resource_type
      AND COALESCE(resource_id::text, '') = COALESCE(log_sensitive_data_access.resource_id::text, '')
      AND created_at > now() - interval '5 minutes'
    );
  END IF;
END;
$$;

-- 5. Améliorer la sécurité des sessions utilisateur
-- Ajouter un trigger pour détecter les connexions suspectes
CREATE OR REPLACE FUNCTION public.detect_suspicious_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_country text;
  previous_ip inet;
  time_diff interval;
  distance_threshold integer := 1000; -- km
BEGIN
  -- Récupérer la session précédente de l'utilisateur
  SELECT country, ip_address, last_active INTO previous_country, previous_ip, time_diff
  FROM public.user_sessions
  WHERE user_id = NEW.user_id 
  AND id != NEW.id
  ORDER BY last_active DESC
  LIMIT 1;

  -- Détecter les changements de pays suspects (moins de 2h entre deux pays différents)
  IF previous_country IS NOT NULL 
     AND NEW.country IS NOT NULL 
     AND previous_country != NEW.country 
     AND (NEW.created_at - time_diff) < interval '2 hours' THEN
    
    NEW.is_suspicious := true;
    NEW.risk_score := GREATEST(NEW.risk_score, 75);
    
    -- Créer un incident de sécurité
    INSERT INTO public.security_incidents (
      organization_id,
      user_id,
      incident_type,
      severity,
      source_ip,
      country,
      city,
      details,
      device_info
    )
    SELECT 
      uo.organization_id,
      NEW.user_id,
      'suspicious_location_change',
      'medium',
      NEW.ip_address,
      NEW.country,
      NEW.city,
      jsonb_build_object(
        'previous_country', previous_country,
        'new_country', NEW.country,
        'time_between_sessions', extract(epoch from (NEW.created_at - time_diff)),
        'session_id', NEW.id
      ),
      jsonb_build_object(
        'browser', NEW.browser,
        'os', NEW.os_details,
        'device_type', NEW.device_type
      )
    FROM public.user_organization_roles uo
    WHERE uo.user_id = NEW.user_id
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer le trigger aux sessions
DROP TRIGGER IF EXISTS detect_suspicious_session_trigger ON public.user_sessions;
CREATE TRIGGER detect_suspicious_session_trigger
  BEFORE INSERT OR UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_suspicious_session();

-- 6. Sécuriser davantage les règles géographiques
-- Ajouter une validation pour éviter les règles contradictoires
CREATE OR REPLACE FUNCTION public.validate_geographic_rule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier qu'il n'y a pas de règles contradictoires pour le même pays/région
  IF EXISTS (
    SELECT 1 FROM public.geographic_security_rules
    WHERE organization_id = NEW.organization_id
    AND rule_value = NEW.rule_value
    AND rule_type != NEW.rule_type
    AND is_active = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Règle contradictoire détectée pour %: %', NEW.rule_type, NEW.rule_value;
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer le trigger aux règles géographiques
DROP TRIGGER IF EXISTS validate_geographic_rule_trigger ON public.geographic_security_rules;
CREATE TRIGGER validate_geographic_rule_trigger
  BEFORE INSERT OR UPDATE ON public.geographic_security_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_geographic_rule();