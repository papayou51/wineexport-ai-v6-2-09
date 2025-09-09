-- Add missing analysis_type column to analyses table
ALTER TABLE public.analyses 
ADD COLUMN analysis_type text NOT NULL DEFAULT 'market_study';

-- Update existing analyses with proper analysis_type based on their results structure
UPDATE public.analyses 
SET analysis_type = 
  CASE 
    WHEN results ? 'market_size' THEN 'market_study'
    WHEN results ? 'import_requirements' THEN 'regulatory_analysis'  
    WHEN results ? 'leads' THEN 'lead_generation'
    WHEN results ? 'marketing_channels' THEN 'marketing_intelligence'
    ELSE 'market_study'
  END;

-- Fix function search path security warning
ALTER FUNCTION public.get_user_organizations(uuid) SET search_path = public;
ALTER FUNCTION public.has_organization_role(uuid, app_role) SET search_path = public;