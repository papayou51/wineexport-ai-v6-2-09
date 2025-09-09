import { useEffect, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAnalyses } from "@/hooks/useAnalyses";
import { useProducts } from "@/hooks/useProducts";
import { useOrganization } from "@/hooks/useOrganization";

interface AlertRule {
  id: string;
  type: 'suggestion' | 'warning' | 'opportunity';
  condition: (data: any) => boolean;
  message: (data: any) => { title: string; message: string; action?: any };
  priority: 'low' | 'medium' | 'high';
  cooldown: number; // en heures
}

const STORAGE_KEY = "marketing_intelligence_alerts_cooldown";
const DAYS_OLD_THRESHOLD = 30;
const NEW_PROJECT_THRESHOLD = 7; // jours

export const useMarketingIntelligenceAlerts = () => {
  const { addNotification } = useNotifications();
  const { organization } = useOrganization();
  const { data: analyses = [] } = useAnalyses(organization?.id);
  const { data: products = [] } = useProducts(organization?.id);

  // Gestion du cooldown pour éviter le spam
  const getCooldownData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const setCooldown = useCallback((alertId: string, hours: number) => {
    const cooldownData = getCooldownData();
    cooldownData[alertId] = Date.now() + (hours * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cooldownData));
  }, [getCooldownData]);

  const isInCooldown = useCallback((alertId: string) => {
    const cooldownData = getCooldownData();
    const cooldownEnd = cooldownData[alertId];
    return cooldownEnd && Date.now() < cooldownEnd;
  }, [getCooldownData]);

  // Règles d'alertes intelligentes
  const alertRules: AlertRule[] = [
    {
      id: 'new_project_marketing_opportunity',
      type: 'suggestion',
      priority: 'high',
      cooldown: 24,
      condition: (data) => {
        const recentProjects = data.products?.filter((p: any) => {
          const created = new Date(p.created_at);
          const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= NEW_PROJECT_THRESHOLD;
        }) || [];
        
        const hasRecentProject = recentProjects.length > 0;
        const hasMarketingAnalysis = data.analyses?.some((a: any) => 
          a.analysis_type === 'marketing_intelligence' &&
          recentProjects.some((p: any) => p.id === a.project_id)
        );
        
        return hasRecentProject && !hasMarketingAnalysis;
      },
      message: (data) => {
        const recentProjects = data.products?.filter((p: any) => {
          const created = new Date(p.created_at);
          const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= NEW_PROJECT_THRESHOLD;
        }) || [];
        
        const projectName = recentProjects[0]?.name || "votre nouveau produit";
        return {
          title: "📈 Intelligence Marketing recommandée",
          message: `Votre produit "${projectName}" pourrait bénéficier d'une analyse marketing pour optimiser son lancement.`,
          action: {
            label: "Analyser maintenant",
            onClick: () => window.location.href = `/products/${recentProjects[0]?.id}`
          }
        };
      }
    },
    {
      id: 'outdated_marketing_analysis',
      type: 'warning',
      priority: 'medium',
      cooldown: 72,
      condition: (data) => {
        const oldAnalyses = data.analyses?.filter((a: any) => {
          if (a.analysis_type !== 'marketing_intelligence') return false;
          const created = new Date(a.created_at);
          const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > DAYS_OLD_THRESHOLD;
        }) || [];
        
        return oldAnalyses.length > 0;
      },
      message: (data) => {
        const oldAnalyses = data.analyses?.filter((a: any) => {
          if (a.analysis_type !== 'marketing_intelligence') return false;
          const created = new Date(a.created_at);
          const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > DAYS_OLD_THRESHOLD;
        }) || [];
        
        const count = oldAnalyses.length;
        return {
          title: "⚠️ Analyses marketing obsolètes",
          message: `Vous avez ${count} analyse(s) marketing de plus de ${DAYS_OLD_THRESHOLD} jours. Les tendances du marché évoluent rapidement.`,
          action: {
            label: "Actualiser",
            onClick: () => window.location.href = `/analyses`
          }
        };
      }
    },
    {
      id: 'multiple_products_no_marketing',
      type: 'opportunity',
      priority: 'medium',
      cooldown: 48,
      condition: (data) => {
        const productsWithoutMarketing = data.products?.filter((p: any) => {
          const hasMarketingAnalysis = data.analyses?.some((a: any) => 
            a.analysis_type === 'marketing_intelligence' && a.project_id === p.id
          );
          return !hasMarketingAnalysis;
        }) || [];
        
        return productsWithoutMarketing.length >= 3;
      },
      message: (data) => {
        const productsWithoutMarketing = data.products?.filter((p: any) => {
          const hasMarketingAnalysis = data.analyses?.some((a: any) => 
            a.analysis_type === 'marketing_intelligence' && a.project_id === p.id
          );
          return !hasMarketingAnalysis;
        }) || [];
        
        const count = productsWithoutMarketing.length;
        return {
          title: "💡 Opportunité portfolio marketing",
          message: `${count} produits n'ont pas encore d'analyse marketing. Une stratégie globale pourrait améliorer vos performances.`,
          action: {
            label: "Voir les produits",
            onClick: () => window.location.href = "/products"
          }
        };
      }
    },
    {
      id: 'successful_analysis_expand',
      type: 'suggestion',
      priority: 'low',
      cooldown: 168, // 7 jours
      condition: (data) => {
        const goodAnalyses = data.analyses?.filter((a: any) => 
          a.analysis_type === 'marketing_intelligence' && 
          a.confidence_score && 
          a.confidence_score > 0.8
        ) || [];
        
        const countries = new Set(goodAnalyses.map((a: any) => a.country_code).filter(Boolean));
        return goodAnalyses.length > 0 && countries.size >= 2;
      },
      message: (data) => {
        const goodAnalyses = data.analyses?.filter((a: any) => 
          a.analysis_type === 'marketing_intelligence' && 
          a.confidence_score && 
          a.confidence_score > 0.8
        ) || [];
        
        const countries = new Set(goodAnalyses.map((a: any) => a.country_code).filter(Boolean));
        return {
          title: "🌍 Expansion internationale suggérée",
          message: `Vos analyses dans ${countries.size} pays montrent de bons résultats. Explorez de nouveaux marchés !`,
          action: {
            label: "Explorer",
            onClick: () => window.location.href = "/analyses"
          }
        };
      }
    }
  ];

  // Vérification des alertes
  const checkAlerts = useCallback(() => {
    if (!organization?.id || !analyses || !products) return;

    const data = { analyses, products, organization };

    alertRules.forEach(rule => {
      if (isInCooldown(rule.id)) return;
      
      if (rule.condition(data)) {
        const { title, message, action } = rule.message(data);
        
        addNotification({
          type: rule.type === 'warning' ? 'warning' : 'info',
          title,
          message,
          action
        });
        
        setCooldown(rule.id, rule.cooldown);
      }
    });
  }, [organization, analyses, products, addNotification, isInCooldown, setCooldown]);

  // Suggestions contextuelles pour une page spécifique
  const getPageSuggestions = useCallback((context: { 
    page: string; 
    productId?: string; 
    analysisType?: string 
  }) => {
    if (!analyses || !products) return [];

    const suggestions = [];

    // Suggestions spécifiques à la page produit
    if (context.page === 'product' && context.productId) {
      const product = products.find(p => p.id === context.productId);
      const hasMarketing = analyses.some(a => 
        a.project_id === context.productId && 
        a.analysis_type === 'marketing_intelligence'
      );

      if (product && !hasMarketing) {
        suggestions.push({
          type: 'marketing_analysis',
          title: "Intelligence Marketing recommandée",
          message: `Analysez les opportunités marketing pour "${product.name}"`,
          action: () => window.location.href = `/project-analysis/${context.productId}?type=marketing_intelligence`
        });
      }
    }

    // Suggestions pour le dashboard
    if (context.page === 'dashboard') {
      const recentAnalyses = analyses
        .filter(a => a.analysis_type === 'marketing_intelligence')
        .slice(0, 3);

      if (recentAnalyses.length > 0) {
        const countries = new Set(recentAnalyses.map(a => a.country_code).filter(Boolean));
        if (countries.size >= 2) {
          suggestions.push({
            type: 'cross_market',
            title: "Analyse croisée des marchés",
            message: `Comparez vos performances dans ${countries.size} pays différents`,
            action: () => window.location.href = "/analyses?filter=marketing_intelligence"
          });
        }
      }
    }

    return suggestions;
  }, [analyses, products]);

  // Vérifier les alertes au montage et lors des changements de données
  useEffect(() => {
    const timer = setTimeout(checkAlerts, 2000); // Délai pour éviter les alertes au chargement initial
    return () => clearTimeout(timer);
  }, [checkAlerts]);

  return {
    checkAlerts,
    getPageSuggestions,
    isInCooldown,
    setCooldown
  };
};