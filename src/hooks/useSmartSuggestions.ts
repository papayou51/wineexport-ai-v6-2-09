import { useMemo } from "react";
import { useAnalyses } from "@/hooks/useAnalyses";
import { useProducts } from "@/hooks/useProducts";
import { useOrganization } from "@/hooks/useOrganization";

interface SmartSuggestion {
  id: string;
  type: 'action' | 'insight' | 'optimization';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  data?: any;
}

interface MarketOpportunity {
  country: string;
  score: number;
  reasons: string[];
  products: string[];
}

export const useSmartSuggestions = (context?: {
  page?: string;
  productId?: string;
  analysisId?: string;
}) => {
  const { organization } = useOrganization();
  const { data: analyses = [] } = useAnalyses(organization?.id);
  const { data: products = [] } = useProducts(organization?.id);

  const suggestions = useMemo(() => {
    const result: SmartSuggestion[] = [];

    // Analyse des performances par pays
    const marketingAnalyses = analyses.filter(a => a.analysis_type === 'marketing_intelligence');
    const countryPerformance = new Map<string, { 
      count: number; 
      avgScore: number; 
      products: Set<string>;
      lastAnalysis: string;
    }>();

    marketingAnalyses.forEach(analysis => {
      if (!analysis.country_code) return;
      
      const country = analysis.country_code;
      const score = analysis.confidence_score || 0;
      const productName = products.find(p => p.id === analysis.project_id)?.name || 'Produit inconnu';
      
      if (!countryPerformance.has(country)) {
        countryPerformance.set(country, {
          count: 0,
          avgScore: 0,
          products: new Set(),
          lastAnalysis: analysis.created_at
        });
      }
      
      const data = countryPerformance.get(country)!;
      data.count += 1;
      data.avgScore = (data.avgScore + score) / 2;
      data.products.add(productName);
      
      if (new Date(analysis.created_at) > new Date(data.lastAnalysis)) {
        data.lastAnalysis = analysis.created_at;
      }
    });

    // Suggestion 1: Meilleurs marchés à développer
    const topMarkets = Array.from(countryPerformance.entries())
      .filter(([_, data]) => data.avgScore > 0.7 && data.count >= 2)
      .sort(([_, a], [__, b]) => b.avgScore - a.avgScore)
      .slice(0, 3);

    if (topMarkets.length > 0) {
      result.push({
        id: 'top_markets_expansion',
        type: 'insight',
        priority: 'high',
        title: "🎯 Marchés prioritaires identifiés",
        description: `${topMarkets.length} marchés montrent des performances excellentes pour vos produits`,
        icon: "TrendingUp",
        action: {
          label: "Voir les opportunités",
          url: "/analyses?filter=marketing_intelligence&sort=score"
        },
        data: { markets: topMarkets.map(([country, data]) => ({ country, ...data })) }
      });
    }

    // Suggestion 2: Produits sans analyse marketing
    const productsWithoutMarketing = products.filter(product => {
      return !marketingAnalyses.some(analysis => analysis.project_id === product.id);
    });

    if (productsWithoutMarketing.length > 0) {
      result.push({
        id: 'products_need_marketing',
        type: 'action',
        priority: productsWithoutMarketing.length > 2 ? 'high' : 'medium',
        title: "📊 Analyses marketing manquantes",
        description: `${productsWithoutMarketing.length} produits n'ont pas d'analyse marketing`,
        icon: "AlertTriangle",
        action: {
          label: "Analyser maintenant",
          url: "/products"
        },
        data: { products: productsWithoutMarketing }
      });
    }

    // Suggestion 3: Analyses obsolètes
    const outdatedAnalyses = marketingAnalyses.filter(analysis => {
      const daysDiff = (Date.now() - new Date(analysis.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 45;
    });

    if (outdatedAnalyses.length > 0) {
      result.push({
        id: 'outdated_analyses',
        type: 'optimization',
        priority: 'medium',
        title: "🔄 Actualisation recommandée",
        description: `${outdatedAnalyses.length} analyses datent de plus de 45 jours`,
        icon: "RefreshCw",
        action: {
          label: "Actualiser les analyses",
          url: "/analyses"
        },
        data: { analyses: outdatedAnalyses }
      });
    }

    // Suggestion 4: Opportunités de marché basées sur les patterns
    const marketOpportunities = findMarketOpportunities(marketingAnalyses, products);
    
    if (marketOpportunities.length > 0) {
      result.push({
        id: 'market_opportunities',
        type: 'insight',
        priority: 'high',
        title: "🌍 Nouvelles opportunités détectées",
        description: `${marketOpportunities.length} marchés émergents identifiés pour vos produits`,
        icon: "Globe",
        action: {
          label: "Explorer les marchés",
          onClick: () => {
            // Ici on pourrait ouvrir une modal avec les détails
            console.log('Market opportunities:', marketOpportunities);
          }
        },
        data: { opportunities: marketOpportunities }
      });
    }

    // Suggestion 5: Optimisation basée sur les résultats existants
    const optimizationSuggestions = generateOptimizationSuggestions(marketingAnalyses);
    
    optimizationSuggestions.forEach(suggestion => {
      result.push(suggestion);
    });

    // Filtrage contextuel
    if (context?.page === 'product' && context.productId) {
      return result.filter(s => 
        s.data?.products?.some((p: any) => p.id === context.productId) ||
        s.type === 'insight'
      );
    }

    if (context?.page === 'dashboard') {
      return result.filter(s => s.priority === 'high').slice(0, 3);
    }

    return result.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [analyses, products, organization, context]);

  return {
    suggestions,
    hasHighPrioritySuggestions: suggestions.some(s => s.priority === 'high'),
    suggestionsByType: {
      actions: suggestions.filter(s => s.type === 'action'),
      insights: suggestions.filter(s => s.type === 'insight'),
      optimizations: suggestions.filter(s => s.type === 'optimization')
    }
  };
};

// Fonctions utilitaires
function findMarketOpportunities(analyses: any[], products: any[]): MarketOpportunity[] {
  const opportunities: MarketOpportunity[] = [];
  
  // Analyse des patterns de succès par catégorie de produit
  const categoryPerformance = new Map<string, { countries: Set<string>; avgScore: number }>();
  
  analyses.forEach(analysis => {
    const product = products.find(p => p.id === analysis.project_id);
    if (!product || !analysis.country_code) return;
    
    const category = product.category;
    if (!categoryPerformance.has(category)) {
      categoryPerformance.set(category, { countries: new Set(), avgScore: 0 });
    }
    
    const data = categoryPerformance.get(category)!;
    data.countries.add(analysis.country_code);
    data.avgScore = (data.avgScore + (analysis.confidence_score || 0)) / 2;
  });

  // Suggérer des marchés similaires pour les catégories performantes
  const suggestedMarkets = ['DE', 'UK', 'IT', 'ES', 'BE', 'NL', 'CH', 'LU'];
  const analyzedCountries = new Set(analyses.map(a => a.country_code).filter(Boolean));
  
  categoryPerformance.forEach((data, category) => {
    if (data.avgScore > 0.7) {
      const unexploredMarkets = suggestedMarkets.filter(country => !analyzedCountries.has(country));
      
      if (unexploredMarkets.length > 0) {
        opportunities.push({
          country: unexploredMarkets[0], // Prendre le premier marché non exploré
          score: data.avgScore,
          reasons: [
            `Performance excellente en ${category}`,
            `Marché similaire aux marchés où vous réussissez`,
            `Potentiel d'expansion élevé`
          ],
          products: Array.from(data.countries)
        });
      }
    }
  });
  
  return opportunities.slice(0, 3);
}

function generateOptimizationSuggestions(analyses: any[]): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  
  // Analyser les temps de traitement pour suggérer des optimisations
  const avgProcessingTime = analyses
    .filter(a => a.processing_time_ms)
    .reduce((acc, a) => acc + a.processing_time_ms, 0) / analyses.length;
  
  if (avgProcessingTime > 30000) { // Plus de 30 secondes
    suggestions.push({
      id: 'optimize_processing',
      type: 'optimization',
      priority: 'low',
      title: "⚡ Optimisation des performances",
      description: "Vos analyses prennent plus de temps que la moyenne",
      icon: "Zap",
      action: {
        label: "Voir les recommandations",
        onClick: () => console.log('Show optimization tips')
      }
    });
  }
  
  // Suggérer des analyses groupées si beaucoup d'analyses individuelles
  if (analyses.length > 5) {
    const countries = new Set(analyses.map(a => a.country_code).filter(Boolean));
    if (countries.size > 3) {
      suggestions.push({
        id: 'batch_analysis',
        type: 'optimization',
        priority: 'medium',
        title: "📈 Analyse comparative suggérée",
        description: `Comparez vos performances dans ${countries.size} pays simultanément`,
        icon: "BarChart3",
        action: {
          label: "Créer l'analyse",
          url: "/analyses/compare"
        }
      });
    }
  }
  
  return suggestions;
}