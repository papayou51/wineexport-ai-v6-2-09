-- First, drop the projects table temporarily to change the enum
DROP TABLE IF EXISTS public.projects CASCADE;

-- Now drop and recreate the enums with correct values
DROP TYPE IF EXISTS project_type CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS analysis_type CASCADE;
DROP TYPE IF EXISTS lead_type CASCADE;

CREATE TYPE project_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence', 'full_analysis');
CREATE TYPE project_status AS ENUM ('draft', 'running', 'completed', 'failed');
CREATE TYPE analysis_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence');
CREATE TYPE lead_type AS ENUM ('importer', 'distributor', 'retailer', 'restaurant', 'hotel');

-- Recreate projects table with correct enum types
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'draft',
  products UUID[] DEFAULT ARRAY[]::UUID[],
  target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  budget_range TEXT,
  timeline TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and create policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization projects" ON public.projects
  FOR SELECT USING (has_organization_role(organization_id, 'member'));

CREATE POLICY "Users can manage organization projects" ON public.projects
  FOR ALL USING (has_organization_role(organization_id, 'member'));

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();