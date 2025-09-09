import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { QuickTooltip } from "@/components/ui/tooltip-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useComponentPerformance } from "@/hooks/usePerformanceMonitoring";
import { FileText, Download, Share, Eye, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Report {
  id: string;
  project_id: string;
  title: string;
  report_type: string;
  created_at: string;
  pdf_url?: string;
  expires_at?: string;
  projects: {
    name: string;
  };
}

const Reports = () => {
  useComponentPerformance('Reports');
  const { handleError } = useErrorHandler();
  
  const { data: reports, isLoading } = useQuery({
    queryKey: ['all-reports'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            projects!inner (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as Report[];
      } catch (error) {
        handleError(error as Error, 'Chargement des rapports');
        throw error;
      }
    },
  });

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'market_analysis':
        return 'Analyse de marché';
      case 'regulatory_report':
        return 'Rapport réglementaire';
      case 'lead_report':
        return 'Rapport de prospects';
      case 'marketing_strategy':
        return 'Stratégie marketing';
      case 'comprehensive':
        return 'Rapport complet';
      default:
        return type;
    }
  };

  const getReportTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'market_analysis':
        return 'variant-secondary';
      case 'regulatory_report':
        return 'variant-outline';
      case 'lead_report':
        return 'variant-secondary';
      case 'marketing_strategy':
        return 'variant-outline';
      case 'comprehensive':
        return 'variant-default';
      default:
        return 'variant-secondary';
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Rapports</h1>
        <p className="text-muted-foreground mt-2">
          Gérez et consultez tous vos rapports d'analyse
        </p>
      </div>

      {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucun rapport trouvé
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Les rapports seront générés automatiquement après vos analyses. 
              Lancez votre première analyse pour commencer.
            </p>
            <Button asChild>
              <Link to="/projects">Voir mes projets</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {report.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.projects.name}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  {getReportTypeLabel(report.report_type)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(report.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>

                {report.expires_at && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={`${isExpired(report.expires_at) ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isExpired(report.expires_at) 
                        ? 'Expiré' 
                        : `Expire le ${format(new Date(report.expires_at), 'dd MMM yyyy', { locale: fr })}`
                      }
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/analysis-report/${report.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Link>
                  </Button>
                  
                  {report.pdf_url && !isExpired(report.expires_at) && (
                    <QuickTooltip text="Télécharger le PDF">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(report.pdf_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </QuickTooltip>
                  )}
                  
                  <QuickTooltip text="Partage bientôt disponible">
                    <Button variant="outline" size="sm" disabled>
                      <Share className="h-4 w-4" />
                    </Button>
                  </QuickTooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;