-- Correction des avertissements de sécurité détectés

-- 1. Corriger le search_path pour les fonctions existantes qui n'en ont pas
-- Mise à jour des fonctions avec search_path mutable

-- Fonction handle_new_user_profile avec search_path fixe
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Fonction handle_new_user avec search_path fixe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
  org_name text;
BEGIN
  -- Get organization name from user metadata, default to email if not provided
  org_name := COALESCE(
    NEW.raw_user_meta_data ->> 'organization_name',
    split_part(NEW.email, '@', 1) || ' Organization'
  );

  -- Create organization
  INSERT INTO public.organizations (name, slug, description)
  VALUES (
    org_name,
    lower(replace(replace(org_name, ' ', '-'), '.', '-')),
    'Organisation créée automatiquement'
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner of the organization
  INSERT INTO public.user_organization_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  RETURN NEW;
END;
$$;

-- Fonction get_user_organizations avec search_path fixe
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(organization_id uuid, role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT uo.organization_id, uo.role
  FROM public.user_organization_roles uo
  WHERE uo.user_id = user_uuid;
$$;

-- Fonction has_organization_role avec search_path fixe
CREATE OR REPLACE FUNCTION public.has_organization_role(org_id uuid, required_role app_role DEFAULT 'member'::app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Fonction update_updated_at_column avec search_path fixe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Les fonctions nouvellement créées ont déjà le bon search_path
-- verify_organization_access, log_sensitive_data_access, detect_suspicious_session, validate_geographic_rule

-- 3. Activer la protection contre les mots de passe compromis
-- Cette configuration doit être faite via l'interface Supabase ou via l'API d'administration
-- Nous allons créer une fonction pour rappeler aux administrateurs de l'activer

CREATE OR REPLACE FUNCTION public.check_security_configuration()
RETURNS TABLE(
  security_check text,
  status text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Password Protection'::text,
    'MANUAL_CHECK_REQUIRED'::text,
    'Activer la protection contre les mots de passe compromis dans Auth > Settings > Password Protection'::text;
END;
$$;

-- 4. Créer des index pour améliorer les performances des requêtes de sécurité
CREATE INDEX IF NOT EXISTS idx_security_incidents_org_created 
ON public.security_incidents(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_incidents_user_type 
ON public.security_incidents(user_id, incident_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
ON public.user_sessions(user_id, last_active DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_suspicious 
ON public.user_sessions(is_suspicious, created_at DESC) 
WHERE is_suspicious = true;

CREATE INDEX IF NOT EXISTS idx_geographic_rules_org_active 
ON public.geographic_security_rules(organization_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_threat_intelligence_ip 
ON public.threat_intelligence(ip_address, expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created 
ON public.audit_logs(organization_id, created_at DESC);

-- 5. Ajouter des contraintes de validation supplémentaires
ALTER TABLE public.security_incidents 
ADD CONSTRAINT check_severity_valid 
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.security_incidents 
ADD CONSTRAINT check_incident_type_valid 
CHECK (incident_type IN (
  'suspicious_location_change', 
  'brute_force_attempt', 
  'multiple_failed_logins',
  'suspicious_device',
  'geographic_violation',
  'threat_intelligence_match',
  'unusual_activity'
));

ALTER TABLE public.geographic_security_rules 
ADD CONSTRAINT check_rule_type_valid 
CHECK (rule_type IN ('allow_country', 'block_country', 'allow_region', 'block_region', 'geofence'));

-- 6. Commentaires de documentation pour les fonctions de sécurité
COMMENT ON FUNCTION public.verify_organization_access(uuid, app_role) 
IS 'Fonction sécurisée pour vérifier l''accès aux ressources d''organisation avec gestion des rôles hiérarchiques';

COMMENT ON FUNCTION public.log_sensitive_data_access(text, uuid, text) 
IS 'Fonction d''audit automatique pour tracer les accès aux données sensibles avec déduplication';

COMMENT ON FUNCTION public.detect_suspicious_session() 
IS 'Trigger de détection des sessions suspectes basé sur les changements géographiques rapides';

COMMENT ON FUNCTION public.validate_geographic_rule() 
IS 'Trigger de validation pour éviter les règles géographiques contradictoires';

COMMENT ON TABLE public.threat_intelligence 
IS 'Table des données de threat intelligence avec accès restreint aux utilisateurs authentifiés';

COMMENT ON TABLE public.security_incidents 
IS 'Table des incidents de sécurité avec audit automatique et détection des anomalies';