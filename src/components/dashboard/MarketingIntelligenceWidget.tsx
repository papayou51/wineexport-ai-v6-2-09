import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Globe, 
  Target, 
  ArrowRight,
  Lightbulb,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalyses } from "@/hooks/useAnalyses";
import { useOrganization } from "@/hooks/useOrganization";

interface MarketingIntelligenceWidgetProps {
  className?: string;
}

export const MarketingIntelligenceWidget = ({ className }: MarketingIntelligenceWidgetProps) => {
  const { organization } = useOrganization();
  const { data: analyses = [] } = useAnalyses(organization?.id);
  
  // Get the most recent marketing intelligence analyses
  const marketingAnalyses = analyses
    .filter(analysis => analysis.analysis_type === 'marketing_intelligence')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const totalMarketingAnalyses = marketingAnalyses.length;
  const uniqueCountries = [...new Set(marketingAnalyses.map(a => a.country_code))].length;

  // Get key insights from the most recent analysis
  const latestAnalysis = marketingAnalyses[0];
  const keyInsights = latestAnalysis?.results ? [
    {
      icon: Target,
      text: `${latestAnalysis.results.positioning_recommendations?.length || 0} recommandations de positionnement`,
      country: latestAnalysis.country_code
    },
    {
      icon: BarChart3,
      text: `${latestAnalysis.results.marketing_channels?.length || 0} canaux marketing identifiés`,
      country: latestAnalysis.country_code
    },
    {
      icon: TrendingUp,
      text: `${latestAnalysis.results.success_factors?.length || 0} facteurs clés de succès`,
      country: latestAnalysis.country_code
    }
  ] : [];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            Intelligence Marketing
          </CardTitle>
          {totalMarketingAnalyses > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalMarketingAnalyses} analyse{totalMarketingAnalyses > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {totalMarketingAnalyses === 0 ? (
          <div className="text-center py-6">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucune analyse marketing réalisée
            </p>
            <Link to="/projects/new">
              <Button size="sm" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Créer un projet d'analyse
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{totalMarketingAnalyses}</div>
                <div className="text-xs text-muted-foreground">Analyses</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{uniqueCountries}</div>
                <div className="text-xs text-muted-foreground">Pays étudiés</div>
              </div>
            </div>

            {/* Key Insights */}
            {keyInsights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Derniers insights</h4>
                <div className="space-y-2">
                  {keyInsights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <insight.icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="flex-1">{insight.text}</span>
                      <Badge variant="outline" className="text-xs">
                        {insight.country}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Countries */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Pays récemment analysés</h4>
              <div className="flex flex-wrap gap-1">
                {marketingAnalyses.slice(0, 4).map((analysis) => (
                  <Badge key={analysis.id} variant="secondary" className="text-xs">
                    {analysis.country_code}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <Link to="/analyses">
              <Button variant="outline" size="sm" className="w-full">
                Voir toutes les analyses marketing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};