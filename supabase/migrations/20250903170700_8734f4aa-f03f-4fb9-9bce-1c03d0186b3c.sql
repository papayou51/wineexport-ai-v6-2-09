-- Add missing RLS policies for all tables

-- Policies for analyses
CREATE POLICY "Users can view project analyses" ON public.analyses
  FOR SELECT USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage project analyses" ON public.analyses
  FOR ALL USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Policies for market_studies
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

-- Policies for regulatory_analyses
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

-- Policies for leads
CREATE POLICY "Users can view project leads" ON public.leads
  FOR SELECT USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage project leads" ON public.leads
  FOR ALL USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

-- Policies for marketing_intelligence
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

-- Policies for reports
CREATE POLICY "Users can view project reports" ON public.reports
  FOR SELECT USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));

CREATE POLICY "Users can manage project reports" ON public.reports
  FOR ALL USING (project_id IN (
    SELECT pr.id FROM projects pr WHERE has_organization_role(pr.organization_id, 'member')
  ));