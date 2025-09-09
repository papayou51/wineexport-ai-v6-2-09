-- Create enum types for projects and analyses (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence', 'full_analysis');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'running', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE analysis_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_type AS ENUM ('importer', 'distributor', 'retailer', 'restaurant', 'hotel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
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

-- Create analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  analysis_type analysis_type NOT NULL,
  country_code TEXT,
  input_data JSONB,
  results JSONB,
  llm_model_used TEXT,
  processing_time_ms INTEGER,
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_studies table
CREATE TABLE IF NOT EXISTS public.market_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  market_size JSONB,
  growth_trends JSONB,
  competitor_analysis JSONB,
  consumer_preferences JSONB,
  distribution_channels JSONB,
  price_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create regulatory_analyses table
CREATE TABLE IF NOT EXISTS public.regulatory_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  import_requirements JSONB,
  taxes_duties JSONB,
  labeling_requirements JSONB,
  certifications_needed JSONB,
  restrictions JSONB,
  compliance_checklist JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  lead_type lead_type NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  country_code TEXT NOT NULL,
  annual_volume INTEGER,
  price_range TEXT,
  business_focus TEXT[],
  current_suppliers TEXT[],
  qualification_score NUMERIC,
  contact_status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_intelligence table
CREATE TABLE IF NOT EXISTS public.marketing_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  positioning_recommendations JSONB,
  pricing_strategy JSONB,
  marketing_channels JSONB,
  seasonal_trends JSONB,
  cultural_considerations JSONB,
  success_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB,
  html_content TEXT,
  pdf_url TEXT,
  generated_by UUID NOT NULL,
  shared_with UUID[],
  access_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create llm_runs table for cost tracking
CREATE TABLE IF NOT EXISTS public.llm_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  project_id UUID,
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd NUMERIC,
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
DROP POLICY IF EXISTS "Users can view organization projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage organization projects" ON public.projects;

CREATE POLICY "Users can view organization projects" ON public.projects
  FOR SELECT USING (has_organization_role(organization_id, 'member'));

CREATE POLICY "Users can manage organization projects" ON public.projects
  FOR ALL USING (has_organization_role(organization_id, 'member'));

-- Create RLS policies for analyses
DROP POLICY IF EXISTS "Users can view project analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can manage project analyses" ON public.analyses;

CREATE POLICY "Users can view project analyses" ON public.analyses
  FOR SELECT USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage project analyses" ON public.analyses
  FOR ALL USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Create RLS policies for market_studies
DROP POLICY IF EXISTS "Users can view market studies" ON public.market_studies;
DROP POLICY IF EXISTS "Users can manage market studies" ON public.market_studies;

CREATE POLICY "Users can view market studies" ON public.market_studies
  FOR SELECT USING (analysis_id IN (
    SELECT a.id FROM analyses a 
    JOIN projects pr ON a.project_id = pr.id 
    WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage market studies" ON public.market_studies
  FOR ALL USING (analysis_id IN (
    SELECT a.id FROM analyses a 
    JOIN projects pr ON a.project_id = pr.id 
    WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Create RLS policies for regulatory_analyses
DROP POLICY IF EXISTS "Users can view regulatory analyses" ON public.regulatory_analyses;
DROP POLICY IF EXISTS "Users can manage regulatory analyses" ON public.regulatory_analyses;

CREATE POLICY "Users can view regulatory analyses" ON public.regulatory_analyses
  FOR SELECT USING (analysis_id IN (
    SELECT a.id FROM analyses a 
    JOIN projects pr ON a.project_id = pr.id 
    WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage regulatory analyses" ON public.regulatory_analyses
  FOR ALL USING (analysis_id IN (
    SELECT a.id FROM analyses a 
    JOIN projects pr ON a.project_id = pr.id 
    WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Create RLS policies for leads
DROP POLICY IF EXISTS "Users can view project leads" ON public.leads;
DROP POLICY IF EXISTS "Users can manage project leads" ON public.leads;

CREATE POLICY "Users can view project leads" ON public.leads
  FOR SELECT USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage project leads" ON public.leads
  FOR ALL USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Create RLS policies for marketing_intelligence
DROP POLICY IF EXISTS "Users can view marketing intelligence" ON public.marketing_intelligence;
DROP POLICY IF EXISTS "Users can manage marketing intelligence" ON public.marketing_intelligence;

CREATE POLICY "Users can view marketing intelligence" ON public.marketing_intelligence
  FOR SELECT USING (analysis_id IN (
    SELECT a.id FROM analyses a 
    JOIN projects pr ON a.project_id = pr.id 
    WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage marketing intelligence" ON public.marketing_intelligence
  FOR ALL USING (analysis_id IN (
    SELECT a.id FROM analyses a 
    JOIN projects pr ON a.project_id = pr.id 
    WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Create RLS policies for reports
DROP POLICY IF EXISTS "Users can view project reports" ON public.reports;
DROP POLICY IF EXISTS "Users can manage project reports" ON public.reports;

CREATE POLICY "Users can view project reports" ON public.reports
  FOR SELECT USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage project reports" ON public.reports
  FOR ALL USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Create RLS policies for llm_runs
DROP POLICY IF EXISTS "Users can view organization LLM runs" ON public.llm_runs;
DROP POLICY IF EXISTS "Users can create LLM runs" ON public.llm_runs;

CREATE POLICY "Users can view organization LLM runs" ON public.llm_runs
  FOR SELECT USING (has_organization_role(organization_id, 'member'));

CREATE POLICY "Users can create LLM runs" ON public.llm_runs
  FOR INSERT WITH CHECK (has_organization_role(organization_id, 'member'));

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();