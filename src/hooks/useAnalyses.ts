import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Analysis {
  id: string;
  project_id: string;
  analysis_type: 'market_study' | 'regulatory_analysis' | 'lead_generation' | 'marketing_intelligence';
  country_code?: string;
  input_data?: any;
  results?: any;
  llm_model_used?: string;
  processing_time_ms?: number;
  confidence_score?: number;
  created_at: string;
}

export const useAnalyses = (organizationId?: string) => {
  return useQuery({
    queryKey: ['analyses', 'organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Fixed query: Use a subquery instead of problematic join
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (!projects || projects.length === 0) return [];
      
      const projectIds = projects.map(p => p.id);
      
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Analysis[];
    },
    enabled: !!organizationId,
  });
};

export const useProjectAnalyses = (projectId: string) => {
  return useQuery({
    queryKey: ['analyses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Analysis[];
    },
    enabled: !!projectId,
  });
};

export const useAnalysis = (analysisId: string) => {
  return useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) throw error;
      return data as Analysis;
    },
    enabled: !!analysisId,
  });
};

export const useRunAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      analysisType,
      countryCode,
      inputData,
    }: {
      projectId: string;
      analysisType: Analysis['analysis_type'];
      countryCode?: string;
      inputData: any;
    }) => {
      // Map analysis types to their corresponding edge functions
      const functionMap: Record<Analysis['analysis_type'], string> = {
        'market_study': 'run-market-analysis',
        'lead_generation': 'run-lead-generation',
        'regulatory_analysis': 'run-regulatory-analysis',
        'marketing_intelligence': 'run-marketing-intelligence'
      };

      const functionName = functionMap[analysisType];
      
      if (!functionName) {
        throw new Error(`Type d'analyse non supporté: ${analysisType}`);
      }

      console.log(`Appel de la fonction Edge: ${functionName} pour le projet ${projectId}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          projectId,
          countryCode,
          inputData,
        }
      });

      if (error) {
        console.error(`Erreur lors de l'appel de ${functionName}:`, error);
        throw error;
      }
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analyses', variables.projectId] });
      toast({
        title: "Analyse lancée",
        description: "L'analyse a été lancée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error running analysis:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible de lancer l'analyse.",
        variant: "destructive",
      });
    },
  });
};