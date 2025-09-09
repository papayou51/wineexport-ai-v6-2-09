-- Create table for geographic security rules
CREATE TABLE public.geographic_security_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('allow_country', 'block_country', 'allow_region', 'block_region', 'geofence')),
  rule_value TEXT NOT NULL, -- Country code, region name, or geofence coordinates
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority rules are evaluated first
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create table for trusted devices
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL, -- Hash of device characteristics
  device_name TEXT, -- User-friendly name
  device_type TEXT, -- Mobile, Desktop, etc.
  os_details TEXT,
  browser TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trust_score INTEGER NOT NULL DEFAULT 100, -- 0-100, decreases with suspicious activity
  is_trusted BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  UNIQUE(user_id, device_fingerprint)
);

-- Create table for attack pattern detection
CREATE TABLE public.attack_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('brute_force', 'credential_stuffing', 'bot_detection', 'rapid_location_change', 'impossible_travel', 'multiple_countries')),
  threshold_config JSONB NOT NULL, -- Configuration for detection thresholds
  action_type TEXT NOT NULL CHECK (action_type IN ('block', 'alert', 'require_mfa', 'delay')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for security incidents
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip INET,
  country TEXT,
  city TEXT,
  device_info JSONB,
  details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for threat intelligence integration
CREATE TABLE public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  threat_type TEXT NOT NULL CHECK (threat_type IN ('malicious', 'suspicious', 'bot', 'proxy', 'tor', 'vpn', 'hosting')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source TEXT NOT NULL, -- Which threat intelligence provider
  details JSONB,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.geographic_security_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for geographic_security_rules
CREATE POLICY "Users can view organization geographic rules"
ON public.geographic_security_rules
FOR SELECT
USING (has_organization_role(organization_id, 'member'));

CREATE POLICY "Admins can manage organization geographic rules"
ON public.geographic_security_rules
FOR ALL
USING (has_organization_role(organization_id, 'admin'));

-- RLS Policies for trusted_devices
CREATE POLICY "Users can manage their own trusted devices"
ON public.trusted_devices
FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for attack_patterns
CREATE POLICY "Users can view organization attack patterns"
ON public.attack_patterns
FOR SELECT
USING (has_organization_role(organization_id, 'member'));

CREATE POLICY "Admins can manage organization attack patterns"
ON public.attack_patterns
FOR ALL
USING (has_organization_role(organization_id, 'admin'));

-- RLS Policies for security_incidents
CREATE POLICY "Users can view organization security incidents"
ON public.security_incidents
FOR SELECT
USING (has_organization_role(organization_id, 'member'));

CREATE POLICY "Admins can manage organization security incidents"
ON public.security_incidents
FOR ALL
USING (has_organization_role(organization_id, 'admin'));

-- RLS Policies for threat_intelligence
CREATE POLICY "System can read threat intelligence"
ON public.threat_intelligence
FOR SELECT
USING (true); -- Public read for system use

CREATE POLICY "System can manage threat intelligence"
ON public.threat_intelligence
FOR ALL
USING (true); -- Allow system updates

-- Create indexes for performance
CREATE INDEX idx_geographic_rules_org_active ON public.geographic_security_rules(organization_id, is_active, priority);
CREATE INDEX idx_trusted_devices_user_fingerprint ON public.trusted_devices(user_id, device_fingerprint);
CREATE INDEX idx_attack_patterns_org_active ON public.attack_patterns(organization_id, is_active);
CREATE INDEX idx_security_incidents_org_created ON public.security_incidents(organization_id, created_at DESC);
CREATE INDEX idx_security_incidents_user_created ON public.security_incidents(user_id, created_at DESC);
CREATE INDEX idx_threat_intelligence_ip ON public.threat_intelligence(ip_address);
CREATE INDEX idx_threat_intelligence_expires ON public.threat_intelligence(expires_at) WHERE expires_at IS NOT NULL;

-- Create trigger for updated_at columns
CREATE TRIGGER update_geographic_security_rules_updated_at
  BEFORE UPDATE ON public.geographic_security_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attack_patterns_updated_at
  BEFORE UPDATE ON public.attack_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threat_intelligence_updated_at
  BEFORE UPDATE ON public.threat_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default attack patterns for organizations
INSERT INTO public.attack_patterns (organization_id, pattern_type, threshold_config, action_type)
SELECT 
  o.id as organization_id,
  'brute_force' as pattern_type,
  '{"max_attempts": 5, "time_window_minutes": 15}' as threshold_config,
  'block' as action_type
FROM public.organizations o;

INSERT INTO public.attack_patterns (organization_id, pattern_type, threshold_config, action_type)
SELECT 
  o.id as organization_id,
  'rapid_location_change' as pattern_type,
  '{"max_distance_km": 1000, "time_window_minutes": 60}' as threshold_config,
  'alert' as action_type
FROM public.organizations o;

INSERT INTO public.attack_patterns (organization_id, pattern_type, threshold_config, action_type)
SELECT 
  o.id as organization_id,
  'multiple_countries' as pattern_type,
  '{"max_countries": 3, "time_window_hours": 6}' as threshold_config,
  'require_mfa' as action_type
FROM public.organizations o;