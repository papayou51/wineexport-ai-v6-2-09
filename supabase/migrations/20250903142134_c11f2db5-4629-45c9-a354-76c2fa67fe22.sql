-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types
CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE project_type AS ENUM ('market_study', 'market_identification');
CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');
CREATE TYPE analysis_type AS ENUM ('market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence', 'country_scoring', 'product_analysis');
CREATE TYPE lead_type AS ENUM ('importer', 'distributor', 'agent', 'retailer', 'horeca');
CREATE TYPE product_category AS ENUM ('wine', 'spirits', 'champagne', 'beer');

-- Organizations table (multi-tenant base)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User organization roles (multi-tenant access control)
CREATE TABLE public.user_organization_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Products table (Intelligence Documentaire)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category product_category NOT NULL,
  vintage INTEGER,
  appellation TEXT,
  alcohol_percentage DECIMAL(4,2),
  volume_ml INTEGER,
  description TEXT,
  tasting_notes TEXT,
  awards TEXT[],
  certifications TEXT[],
  technical_specs JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product versions (PDF processing history)
CREATE TABLE public.product_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  source_pdf_url TEXT,
  extracted_data JSONB,
  validation_status TEXT DEFAULT 'pending',
  validated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product attachments (files storage)
CREATE TABLE public.product_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Countries reference table
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT,
  sub_region TEXT,
  economic_data JSONB,
  wine_market_data JSONB,
  regulatory_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table (main export studies)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'draft',
  target_countries TEXT[],
  products UUID[],
  budget_range TEXT,
  timeline TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analyses table (AI results storage)
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  analysis_type analysis_type NOT NULL,
  country_code TEXT,
  input_data JSONB,
  results JSONB,
  confidence_score DECIMAL(3,2),
  llm_model_used TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market studies (detailed market analysis)
CREATE TABLE public.market_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  market_size JSONB,
  growth_trends JSONB,
  competitor_analysis JSONB,
  price_analysis JSONB,
  distribution_channels JSONB,
  consumer_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Regulatory analyses
CREATE TABLE public.regulatory_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  import_requirements JSONB,
  labeling_requirements JSONB,
  certifications_needed JSONB,
  taxes_duties JSONB,
  restrictions JSONB,
  compliance_checklist JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketing intelligence
CREATE TABLE public.marketing_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  positioning_recommendations JSONB,
  pricing_strategy JSONB,
  marketing_channels JSONB,
  seasonal_trends JSONB,
  cultural_considerations JSONB,
  success_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads table (qualified prospects)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  country_code TEXT NOT NULL,
  lead_type lead_type NOT NULL,
  business_focus TEXT[],
  annual_volume INTEGER,
  price_range TEXT,
  current_suppliers TEXT[],
  qualification_score DECIMAL(3,2),
  contact_status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reports table (generated documents)
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  content JSONB,
  pdf_url TEXT,
  html_content TEXT,
  generated_by UUID NOT NULL,
  shared_with TEXT[],
  access_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- LLM runs (AI traceability)
CREATE TABLE public.llm_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,4),
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vectors table (RAG embeddings)
CREATE TABLE public.vectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vectors ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(organization_id UUID, role app_role)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT uo.organization_id, uo.role
  FROM public.user_organization_roles uo
  WHERE uo.user_id = user_uuid;
$$;

-- Security definer function to check user role in organization
CREATE OR REPLACE FUNCTION public.has_organization_role(org_id UUID, required_role app_role DEFAULT 'member')
RETURNS BOOLEAN
LANGUAGE SQL
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

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.get_user_organizations())
  );

CREATE POLICY "Organization owners can update" ON public.organizations
  FOR UPDATE USING (
    public.has_organization_role(id, 'owner')
  );

-- RLS Policies for user_organization_roles
CREATE POLICY "Users can view their organization roles" ON public.user_organization_roles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.get_user_organizations())
  );

CREATE POLICY "Organization admins can manage roles" ON public.user_organization_roles
  FOR ALL USING (
    public.has_organization_role(organization_id, 'admin')
  );

-- RLS Policies for products
CREATE POLICY "Users can view organization products" ON public.products
  FOR SELECT USING (
    public.has_organization_role(organization_id, 'member')
  );

CREATE POLICY "Users can manage organization products" ON public.products
  FOR ALL USING (
    public.has_organization_role(organization_id, 'member')
  );

-- RLS Policies for product_versions
CREATE POLICY "Users can view product versions" ON public.product_versions
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM public.products p
      WHERE public.has_organization_role(p.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage product versions" ON public.product_versions
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM public.products p
      WHERE public.has_organization_role(p.organization_id, 'member')
    )
  );

-- RLS Policies for product_attachments
CREATE POLICY "Users can view product attachments" ON public.product_attachments
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM public.products p
      WHERE public.has_organization_role(p.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage product attachments" ON public.product_attachments
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM public.products p
      WHERE public.has_organization_role(p.organization_id, 'member')
    )
  );

-- RLS Policies for countries (public read access)
CREATE POLICY "Countries are publicly readable" ON public.countries
  FOR SELECT USING (true);

-- RLS Policies for projects
CREATE POLICY "Users can view organization projects" ON public.projects
  FOR SELECT USING (
    public.has_organization_role(organization_id, 'member')
  );

CREATE POLICY "Users can manage organization projects" ON public.projects
  FOR ALL USING (
    public.has_organization_role(organization_id, 'member')
  );

-- RLS Policies for analyses
CREATE POLICY "Users can view project analyses" ON public.analyses
  FOR SELECT USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage project analyses" ON public.analyses
  FOR ALL USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

-- RLS Policies for market_studies
CREATE POLICY "Users can view market studies" ON public.market_studies
  FOR SELECT USING (
    analysis_id IN (
      SELECT a.id FROM public.analyses a
      JOIN public.projects pr ON a.project_id = pr.id
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage market studies" ON public.market_studies
  FOR ALL USING (
    analysis_id IN (
      SELECT a.id FROM public.analyses a
      JOIN public.projects pr ON a.project_id = pr.id
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

-- RLS Policies for regulatory_analyses
CREATE POLICY "Users can view regulatory analyses" ON public.regulatory_analyses
  FOR SELECT USING (
    analysis_id IN (
      SELECT a.id FROM public.analyses a
      JOIN public.projects pr ON a.project_id = pr.id
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage regulatory analyses" ON public.regulatory_analyses
  FOR ALL USING (
    analysis_id IN (
      SELECT a.id FROM public.analyses a
      JOIN public.projects pr ON a.project_id = pr.id
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

-- RLS Policies for marketing_intelligence
CREATE POLICY "Users can view marketing intelligence" ON public.marketing_intelligence
  FOR SELECT USING (
    analysis_id IN (
      SELECT a.id FROM public.analyses a
      JOIN public.projects pr ON a.project_id = pr.id
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage marketing intelligence" ON public.marketing_intelligence
  FOR ALL USING (
    analysis_id IN (
      SELECT a.id FROM public.analyses a
      JOIN public.projects pr ON a.project_id = pr.id
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

-- RLS Policies for leads
CREATE POLICY "Users can view project leads" ON public.leads
  FOR SELECT USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage project leads" ON public.leads
  FOR ALL USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

-- RLS Policies for reports
CREATE POLICY "Users can view project reports" ON public.reports
  FOR SELECT USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

CREATE POLICY "Users can manage project reports" ON public.reports
  FOR ALL USING (
    project_id IN (
      SELECT pr.id FROM public.projects pr
      WHERE public.has_organization_role(pr.organization_id, 'member')
    )
  );

-- RLS Policies for llm_runs
CREATE POLICY "Users can view organization LLM runs" ON public.llm_runs
  FOR SELECT USING (
    public.has_organization_role(organization_id, 'member')
  );

CREATE POLICY "Users can create LLM runs" ON public.llm_runs
  FOR INSERT WITH CHECK (
    public.has_organization_role(organization_id, 'member')
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can view organization audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.has_organization_role(organization_id, 'admin')
  );

-- RLS Policies for vectors
CREATE POLICY "Users can view organization vectors" ON public.vectors
  FOR SELECT USING (
    public.has_organization_role(organization_id, 'member')
  );

CREATE POLICY "Users can manage organization vectors" ON public.vectors
  FOR ALL USING (
    public.has_organization_role(organization_id, 'member')
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample countries data
INSERT INTO public.countries (code, name, region, sub_region, economic_data, wine_market_data) VALUES
('FR', 'France', 'Europe', 'Western Europe', '{"gdp": 2940000000000, "population": 67400000}', '{"consumption_per_capita": 47.7, "import_value": 1200000000}'),
('US', 'United States', 'Americas', 'Northern America', '{"gdp": 25460000000000, "population": 331900000}', '{"consumption_per_capita": 13.3, "import_value": 6500000000}'),
('DE', 'Germany', 'Europe', 'Western Europe', '{"gdp": 4220000000000, "population": 83200000}', '{"consumption_per_capita": 24.7, "import_value": 2100000000}'),
('GB', 'United Kingdom', 'Europe', 'Northern Europe', '{"gdp": 3130000000000, "population": 67500000}', '{"consumption_per_capita": 23.3, "import_value": 1800000000}'),
('CN', 'China', 'Asia', 'Eastern Asia', '{"gdp": 17730000000000, "population": 1439000000}', '{"consumption_per_capita": 1.8, "import_value": 2300000000}'),
('JP', 'Japan', 'Asia', 'Eastern Asia', '{"gdp": 4940000000000, "population": 125800000}', '{"consumption_per_capita": 3.6, "import_value": 850000000}'),
('CA', 'Canada', 'Americas', 'Northern America', '{"gdp": 1990000000000, "population": 38200000}', '{"consumption_per_capita": 16.4, "import_value": 1100000000}'),
('AU', 'Australia', 'Oceania', 'Australia and New Zealand', '{"gdp": 1550000000000, "population": 25700000}', '{"consumption_per_capita": 25.4, "import_value": 480000000}');

-- Create indexes for better performance
CREATE INDEX idx_user_organization_roles_user_id ON public.user_organization_roles(user_id);
CREATE INDEX idx_user_organization_roles_organization_id ON public.user_organization_roles(organization_id);
CREATE INDEX idx_products_organization_id ON public.products(organization_id);
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_analyses_project_id ON public.analyses(project_id);
CREATE INDEX idx_leads_project_id ON public.leads(project_id);
CREATE INDEX idx_llm_runs_organization_id ON public.llm_runs(organization_id);
CREATE INDEX idx_vectors_embedding ON public.vectors USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_countries_code ON public.countries(code);
CREATE INDEX idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);