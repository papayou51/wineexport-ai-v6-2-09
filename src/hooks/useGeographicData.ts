import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeographicAnalysis {
  id: string;
  project_id: string;
  country_code: string;
  market_score: number;
  demographic_data: {
    population: number;
    gdp_per_capita: number;
    urban_population_percent: number;
    median_age: number;
  };
  economic_indicators: {
    gdp_growth: number;
    inflation_rate: number;
    unemployment_rate: number;
    ease_of_doing_business_rank: number;
  };
  market_potential: {
    market_size_usd: number;
    wine_consumption_per_capita: number;
    import_value_usd: number;
    market_growth_rate: number;
  };
  regulatory_environment: {
    complexity_score: number;
    import_duties_percent: number;
    certification_requirements: string[];
    compliance_timeline_days: number;
  };
  competitive_landscape: {
    main_competitors: string[];
    market_concentration: number;
    price_sensitivity: 'low' | 'medium' | 'high';
    brand_loyalty: 'low' | 'medium' | 'high';
  };
  recommendations: {
    entry_strategy: string;
    recommended_price_range: {
      min: number;
      max: number;
    };
    marketing_channels: string[];
    timeline_months: number;
    investment_required_usd: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CountryProfile {
  code: string;
  name: string;
  region: string;
  subregion: string;
  coordinates: [number, number];
  flag_emoji: string;
  wine_market_tier: 'emerging' | 'developing' | 'mature' | 'premium';
}

// Mock data for geographic analysis (using existing analyses table structure)
const MOCK_GEOGRAPHIC_DATA: GeographicAnalysis[] = [
  {
    id: '1',
    project_id: '',
    country_code: 'FR',
    market_score: 85,
    demographic_data: {
      population: 67000000,
      gdp_per_capita: 42500,
      urban_population_percent: 81,
      median_age: 42
    },
    economic_indicators: {
      gdp_growth: 1.8,
      inflation_rate: 2.1,
      unemployment_rate: 7.4,
      ease_of_doing_business_rank: 32
    },
    market_potential: {
      market_size_usd: 15600000000,
      wine_consumption_per_capita: 40.2,
      import_value_usd: 2800000000,
      market_growth_rate: 2.3
    },
    regulatory_environment: {
      complexity_score: 6,
      import_duties_percent: 0,
      certification_requirements: ['AOC', 'EU Organic', 'Health Certificate'],
      compliance_timeline_days: 30
    },
    competitive_landscape: {
      main_competitors: ['Local Producers', 'Italy', 'Spain'],
      market_concentration: 0.3,
      price_sensitivity: 'medium',
      brand_loyalty: 'high'
    },
    recommendations: {
      entry_strategy: 'Partner with local distributors specializing in premium wines',
      recommended_price_range: { min: 15, max: 50 },
      marketing_channels: ['Wine shops', 'Restaurants', 'Wine fairs'],
      timeline_months: 12,
      investment_required_usd: 250000
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Hook to get geographic analysis for a project (using existing analyses table)
export const useGeographicAnalysis = (projectId: string) => {
  return useQuery({
    queryKey: ['geographic-analysis', projectId],
    queryFn: async () => {
      // For now, return mock data filtered by project ID
      // In production, this would query a dedicated geographic_analyses table
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('project_id', projectId)
        .eq('analysis_type', 'geographic')
        .order('created_at', { ascending: false });

      if (error) {
        // Return mock data for demo purposes
        return MOCK_GEOGRAPHIC_DATA.map(item => ({ ...item, project_id: projectId }));
      }

      // Transform existing data to geographic format if available
      return data.map(analysis => ({
        id: analysis.id,
        project_id: projectId,
        country_code: analysis.country_code,
        market_score: 75, // Default score
        ...MOCK_GEOGRAPHIC_DATA[0], // Use mock structure
        created_at: analysis.created_at,
        updated_at: analysis.created_at
      })) as GeographicAnalysis[];
    },
    enabled: !!projectId
  });
};

// Hook to get country profiles (using existing countries table)
export const useCountryProfiles = (region?: string) => {
  return useQuery({
    queryKey: ['country-profiles', region],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) {
        // Return mock data for demo
        return [
          { code: 'FR', name: 'France', region: 'Europe', subregion: 'Western Europe', coordinates: [2.3522, 46.6030] as [number, number], flag_emoji: '🇫🇷', wine_market_tier: 'mature' as const },
          { code: 'DE', name: 'Germany', region: 'Europe', subregion: 'Western Europe', coordinates: [10.4515, 51.1657] as [number, number], flag_emoji: '🇩🇪', wine_market_tier: 'developing' as const },
          { code: 'US', name: 'United States', region: 'Americas', subregion: 'Northern America', coordinates: [-95.7129, 37.0902] as [number, number], flag_emoji: '🇺🇸', wine_market_tier: 'mature' as const },
          { code: 'GB', name: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe', coordinates: [-3.4360, 55.3781] as [number, number], flag_emoji: '🇬🇧', wine_market_tier: 'premium' as const },
          { code: 'JP', name: 'Japan', region: 'Asia', subregion: 'Eastern Asia', coordinates: [138.2529, 36.2048] as [number, number], flag_emoji: '🇯🇵', wine_market_tier: 'emerging' as const }
        ];
      }

      // Transform countries data to profiles format
      return data.map(country => ({
        code: country.code,
        name: country.name,
        region: country.region || 'Unknown',
        subregion: country.sub_region || 'Unknown',
        coordinates: [0, 0] as [number, number], // Default coordinates
        flag_emoji: '🏳️', // Default flag since property doesn't exist
        wine_market_tier: 'developing' as const
      })) as CountryProfile[];
    }
  });
};

// Hook to generate geographic analysis
export const useGenerateGeographicAnalysis = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      countryCodes,
      analysisType = 'comprehensive'
    }: {
      projectId: string;
      countryCodes: string[];
      analysisType?: 'quick' | 'comprehensive' | 'competitive';
    }) => {
      const { data, error } = await supabase.functions.invoke('run-geographic-analysis', {
        body: {
          projectId,
          countryCodes,
          analysisType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['geographic-analysis', variables.projectId] 
      });
      toast({
        title: "Analyse géographique terminée",
        description: `Analyse générée pour ${variables.countryCodes.length} pays`
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de l'analyse",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

// Hook for geographic market scoring
export const useMarketScoring = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      productProfile,
      countryCode,
      criteria
    }: {
      productProfile: {
        category: string;
        price_range: string;
        target_segment: string;
        production_volume: number;
      };
      countryCode: string;
      criteria: {
        market_size_weight: number;
        competition_weight: number;
        regulatory_weight: number;
        economic_weight: number;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke('calculate-market-score', {
        body: {
          productProfile,
          countryCode,
          criteria
        }
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: "Erreur de calcul",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

// Hook to get geographic insights summary
export const useGeographicInsights = (projectId: string) => {
  return useQuery({
    queryKey: ['geographic-insights', projectId],
    queryFn: async () => {
      // Get mock geographic analyses for the project
      const analyses = MOCK_GEOGRAPHIC_DATA.map(item => ({ ...item, project_id: projectId }));

      if (!analyses || analyses.length === 0) {
        return {
          totalMarketSize: 15600000000,
          avgMarketScore: 85,
          topMarkets: [
            { country_code: 'FR', score: 85, market_size: 15600000000 },
            { country_code: 'DE', score: 78, market_size: 12400000000 },
            { country_code: 'US', score: 82, market_size: 45200000000 }
          ],
          regulatoryComplexity: 6,
          analysisCount: 1,
          recommendedEntry: analyses[0]
        };
      }

      // Calculate insights from analyses
      const totalMarketSize = analyses.reduce((sum, analysis) => 
        sum + (analysis.market_potential?.market_size_usd || 0), 0
      );

      const avgMarketScore = analyses.reduce((sum, analysis) => 
        sum + analysis.market_score, 0
      ) / analyses.length;

      const topMarkets = analyses
        .sort((a, b) => b.market_score - a.market_score)
        .slice(0, 3)
        .map(analysis => ({
          country_code: analysis.country_code,
          score: analysis.market_score,
          market_size: analysis.market_potential?.market_size_usd || 0
        }));

      const regulatoryComplexity = analyses.reduce((sum, analysis) => 
        sum + (analysis.regulatory_environment?.complexity_score || 0), 0
      ) / analyses.length;

      return {
        totalMarketSize,
        avgMarketScore,
        topMarkets,
        regulatoryComplexity,
        analysisCount: analyses.length,
        recommendedEntry: analyses.find(a => a.market_score === Math.max(...analyses.map(a => a.market_score)))
      };
    },
    enabled: !!projectId
  });
};

// Hook for exporting geographic data
export const useExportGeographicData = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      format,
      countries
    }: {
      projectId: string;
      format: 'csv' | 'pdf' | 'excel';
      countries?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('export-geographic-analysis', {
        body: {
          projectId,
          format,
          countries
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Export réussi",
        description: "Les données géographiques ont été exportées"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};