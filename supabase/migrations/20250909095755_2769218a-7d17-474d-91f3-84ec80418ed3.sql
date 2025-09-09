-- CORRECTION URGENTE DES POLITIQUES RLS
-- Ces tables sont actuellement publiquement accessibles !

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_analyses ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques défaillantes s'il y en a
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;

DROP POLICY IF EXISTS "Users can manage their own trusted devices" ON public.trusted_devices;

-- CRÉER DES POLITIQUES RLS SÉCURISÉES

-- Profiles : accès strict au propriétaire uniquement
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Sessions utilisateur : accès strict au propriétaire
CREATE POLICY "user_sessions_select_own" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_insert_own" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_sessions_update_own" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete_own" ON public.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Appareils de confiance : accès strict au propriétaire
CREATE POLICY "trusted_devices_all_own" ON public.trusted_devices
    FOR ALL USING (auth.uid() = user_id);

-- Leads : accès basé sur l'organisation
CREATE POLICY "leads_organization_access" ON public.leads
    FOR ALL USING (
        project_id IN (
            SELECT pr.id FROM projects pr 
            WHERE has_organization_role(pr.organization_id, 'member'::app_role)
        )
    );

-- Analyses : accès basé sur l'organisation  
CREATE POLICY "analyses_organization_access" ON public.analyses
    FOR ALL USING (
        project_id IN (
            SELECT pr.id FROM projects pr 
            WHERE has_organization_role(pr.organization_id, 'member'::app_role)
        )
    );

-- Market studies : accès basé sur l'organisation
CREATE POLICY "market_studies_organization_access" ON public.market_studies
    FOR ALL USING (
        analysis_id IN (
            SELECT a.id FROM analyses a 
            JOIN projects pr ON a.project_id = pr.id
            WHERE has_organization_role(pr.organization_id, 'member'::app_role)
        )
    );

-- Marketing intelligence : accès basé sur l'organisation
CREATE POLICY "marketing_intelligence_organization_access" ON public.marketing_intelligence
    FOR ALL USING (
        analysis_id IN (
            SELECT a.id FROM analyses a 
            JOIN projects pr ON a.project_id = pr.id
            WHERE has_organization_role(pr.organization_id, 'member'::app_role)
        )
    );

-- Regulatory analyses : accès basé sur l'organisation
CREATE POLICY "regulatory_analyses_organization_access" ON public.regulatory_analyses
    FOR ALL USING (
        analysis_id IN (
            SELECT a.id FROM analyses a 
            JOIN projects pr ON a.project_id = pr.id
            WHERE has_organization_role(pr.organization_id, 'member'::app_role)
        )
    );