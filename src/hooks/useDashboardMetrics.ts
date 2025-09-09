import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardMetrics {
  // États IA
  aiProviderStatus: {
    openai: 'operational' | 'degraded' | 'down';
    anthropic: 'operational' | 'degraded' | 'down';
    google: 'operational' | 'degraded' | 'down';
  };
  
  // Activité récente
  recentExtractions: {
    total: number;
    success: number;
    failed: number;
    avgQuality: number;
    avgProcessingTime: number;
  };
  
  // Métriques géographiques
  topCountries: Array<{
    code: string;
    name: string;
    projectCount: number;
    analysisCount: number;
  }>;
  
  // Alertes
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }>;
  
  // Performance
  performance: {
    extractionSuccessRate: number;
    avgResponseTime: number;
    leadsGenerated: number;
    activeProjects: number;
  };
}

export const useDashboardMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!user) throw new Error('No user');

      // Récupérer l'organisation de l'utilisateur
      const { data: userOrgs } = await supabase
        .from('user_organization_roles')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      const orgId = userOrgs?.[0]?.organization_id;
      if (!orgId) throw new Error('No organization');

      // Dernières 24h pour les métriques temps réel
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // 1. État des providers IA (basé sur les runs récents)
      const { data: recentRuns } = await supabase
        .from('llm_runs')
        .select('model_name, error_message, duration_ms, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false });

      const aiProviderStatus = analyzeProviderStatus(recentRuns || []);

      // 2. Métriques d'extraction récentes
      const { data: productSpecs } = await supabase
        .from('product_specs')
        .select('quality_score, providers, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', oneWeekAgo);

      const recentExtractions = analyzeExtractions(productSpecs || []);

      // 3. Top pays ciblés
      const { data: projects } = await supabase
        .from('projects')
        .select('target_countries, id')
        .eq('organization_id', orgId);

      const { data: analyses } = await supabase
        .from('analyses')
        .select('country_code, project_id')
        .in('project_id', (projects || []).map(p => p.id));

      const topCountries = analyzeTopCountries(projects || [], analyses || []);

      // 4. Alertes (analyses échouées, problèmes récents)
      const alerts = generateAlerts(recentRuns || [], productSpecs || []);

      // 5. Métriques de performance
      const { data: leads } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', oneWeekAgo);

      const performance = {
        extractionSuccessRate: recentExtractions.total > 0 
          ? (recentExtractions.success / recentExtractions.total) * 100 
          : 0,
        avgResponseTime: recentExtractions.avgProcessingTime,
        leadsGenerated: leads?.length || 0,
        activeProjects: projects?.filter(p => p.target_countries?.length).length || 0
      };

      return {
        aiProviderStatus,
        recentExtractions,
        topCountries,
        alerts,
        performance
      };
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 15000,
  });
};

// Fonctions d'analyse
function analyzeProviderStatus(runs: any[]) {
  const getProviderStatus = (provider: string) => {
    const providerRuns = runs.filter(r => r.model_name?.includes(provider));
    if (providerRuns.length === 0) return 'operational';
    
    const errorRate = providerRuns.filter(r => r.error_message).length / providerRuns.length;
    if (errorRate > 0.5) return 'down';
    if (errorRate > 0.2) return 'degraded';
    return 'operational';
  };

  return {
    openai: getProviderStatus('gpt') as 'operational' | 'degraded' | 'down',
    anthropic: getProviderStatus('claude') as 'operational' | 'degraded' | 'down',
    google: getProviderStatus('gemini') as 'operational' | 'degraded' | 'down',
  };
}

function analyzeExtractions(specs: any[]) {
  const total = specs.length;
  const success = specs.filter(s => s.quality_score && s.quality_score > 0).length;
  const failed = total - success;
  
  const qualityScores = specs
    .filter(s => s.quality_score)
    .map(s => s.quality_score);
  
  const avgQuality = qualityScores.length > 0 
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
    : 0;

  // Estimation du temps de traitement basé sur les providers
  const processingTimes = specs
    .map(s => s.providers?.runs?.reduce((total: number, run: any) => total + (run.ms || 0), 0))
    .filter(Boolean);
  
  const avgProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
    : 0;

  return {
    total,
    success,
    failed,
    avgQuality,
    avgProcessingTime
  };
}

function analyzeTopCountries(projects: any[], analyses: any[]) {
  const countryStats = new Map<string, { projectCount: number; analysisCount: number }>();

  // Compter les projets par pays
  projects.forEach(project => {
    project.target_countries?.forEach((country: string) => {
      const current = countryStats.get(country) || { projectCount: 0, analysisCount: 0 };
      current.projectCount++;
      countryStats.set(country, current);
    });
  });

  // Compter les analyses par pays
  analyses.forEach(analysis => {
    if (analysis.country_code) {
      const current = countryStats.get(analysis.country_code) || { projectCount: 0, analysisCount: 0 };
      current.analysisCount++;
      countryStats.set(analysis.country_code, current);
    }
  });

  // Convertir en array et trier
  return Array.from(countryStats.entries())
    .map(([code, stats]) => ({
      code,
      name: getCountryName(code),
      ...stats
    }))
    .sort((a, b) => b.projectCount + b.analysisCount - a.projectCount - a.analysisCount)
    .slice(0, 5);
}

function generateAlerts(runs: any[], specs: any[]) {
  const alerts = [];

  // Alertes pour les échecs récents
  const recentFailures = runs.filter(r => r.error_message).slice(0, 3);
  recentFailures.forEach(failure => {
    alerts.push({
      id: `error-${Date.now()}-${Math.random()}`,
      type: 'error' as const,
      title: 'Échec d\'extraction IA',
      message: `Erreur avec ${failure.model_name}: ${failure.error_message}`,
      timestamp: failure.created_at
    });
  });

  // Alertes pour la qualité faible
  const lowQualitySpecs = specs.filter(s => s.quality_score && s.quality_score < 50);
  if (lowQualitySpecs.length > 5) {
    alerts.push({
      id: `quality-${Date.now()}`,
      type: 'warning' as const,
      title: 'Qualité d\'extraction faible',
      message: `${lowQualitySpecs.length} extractions avec une qualité < 50%`,
      timestamp: new Date().toISOString()
    });
  }

  return alerts.slice(0, 5);
}

function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    'FR': 'France',
    'DE': 'Allemagne',
    'GB': 'Royaume-Uni',
    'ES': 'Espagne',
    'IT': 'Italie',
    'US': 'États-Unis',
    'CA': 'Canada',
    'AU': 'Australie',
    'JP': 'Japon',
    'CN': 'Chine'
  };
  return countryNames[code] || code;
}