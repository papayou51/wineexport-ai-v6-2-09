import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { BarChart3, FileText, Users, TrendingUp, Eye, Calendar, Globe } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Analysis {
  id: string;
  project_id: string;
  analysis_type: 'market_study' | 'regulatory_analysis' | 'lead_generation' | 'marketing_intelligence';
  country_code?: string;
  processing_time_ms?: number;
  confidence_score?: number;
  created_at: string;
  projects: {
    name: string;
  };
}

const Analyses = () => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['all-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          projects!inner (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Analysis[];
    },
  });

  const getTypeIcon = (type: Analysis['analysis_type']) => {
    switch (type) {
      case 'market_study':
        return BarChart3;
      case 'regulatory_analysis':
        return FileText;
      case 'lead_generation':
        return Users;
      case 'marketing_intelligence':
        return TrendingUp;
      default:
        return BarChart3;
    }
  };

  const getTypeLabel = (type: Analysis['analysis_type']) => {
    switch (type) {
      case 'market_study':
        return 'Étude de marché';
      case 'regulatory_analysis':
        return 'Analyse réglementaire';
      case 'lead_generation':
        return 'Génération de leads';
      case 'marketing_intelligence':
        return 'Intelligence marketing';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: Analysis['analysis_type']) => {
    switch (type) {
      case 'market_study':
        return 'bg-blue-100 text-blue-800';
      case 'regulatory_analysis':
        return 'bg-green-100 text-green-800';
      case 'lead_generation':
        return 'bg-purple-100 text-purple-800';
      case 'marketing_intelligence':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="analysis" count={6} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Toutes les analyses</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de toutes vos analyses IA réalisées
        </p>
      </div>

      {!analyses || analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune analyse trouvée
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Créez votre premier projet et lancez une analyse pour commencer à explorer vos opportunités d'export.
            </p>
            <Button asChild>
              <Link to="/projects">Créer un projet</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => {
            const Icon = getTypeIcon(analysis.analysis_type);
            return (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {analysis.projects.name}
                        </CardTitle>
                        <Badge className={getTypeBadgeColor(analysis.analysis_type)}>
                          {getTypeLabel(analysis.analysis_type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(analysis.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    {analysis.country_code && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground uppercase">
                          {analysis.country_code}
                        </span>
                      </div>
                    )}
                  </div>

                  {analysis.processing_time_ms && (
                    <div className="text-sm text-muted-foreground">
                      Temps de traitement : {Math.round(analysis.processing_time_ms / 1000)}s
                    </div>
                  )}

                  {analysis.confidence_score && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fiabilité</span>
                      <Badge variant="outline">
                        {Math.round(analysis.confidence_score * 100)}%
                      </Badge>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/analysis-report/${analysis.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le rapport
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Analyses;