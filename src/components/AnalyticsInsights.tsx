import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointer, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Target,
  Zap
} from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useUserAnalytics';

interface AnalyticsInsightsProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  className?: string;
}

export const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({
  dateRange,
  className = ''
}) => {
  const { data: analytics, loading, error } = useAnalyticsData(dateRange);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des données analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const getHealthStatus = (rate: number, thresholds: { good: number; warning: number }) => {
    if (rate >= thresholds.good) return { status: 'good', color: 'text-green-600', icon: CheckCircle2 };
    if (rate >= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
  };

  const conversionHealth = getHealthStatus(analytics.conversionRate, { good: 15, warning: 8 });
  const errorHealth = getHealthStatus(100 - analytics.errorRate, { good: 95, warning: 90 });
  const performanceHealth = getHealthStatus(
    analytics.performanceMetrics.avgLoadTime > 0 ? 
      Math.max(0, 100 - (analytics.performanceMetrics.avgLoadTime / 50)) : 100,
    { good: 80, warning: 60 }
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalSessions} sessions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de conversion</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                  <conversionHealth.icon className={`h-4 w-4 ${conversionHealth.color}`} />
                </div>
                <Badge variant={conversionHealth.status === 'good' ? 'default' : 'destructive'} className="text-xs">
                  {conversionHealth.status === 'good' ? 'Excellent' : 
                   conversionHealth.status === 'warning' ? 'À surveiller' : 'Critique'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">
                  {analytics.performanceMetrics.avgLoadTime.toFixed(0)}ms
                </p>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={Math.min(100, (5000 - analytics.performanceMetrics.avgLoadTime) / 50)} 
                    className="w-16 h-2" 
                  />
                  <performanceHealth.icon className={`h-3 w-3 ${performanceHealth.color}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux d'erreur</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.errorRate.toFixed(1)}%</p>
                  <errorHealth.icon className={`h-4 w-4 ${errorHealth.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Taux de rebond: {analytics.performanceMetrics.bounceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Journey Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Parcours utilisateur - Conversion
          </CardTitle>
          <CardDescription>
            Analyse du tunnel de conversion du workflow Cas 1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.userFlow.map((step, index) => {
              const isFirst = index === 0;
              const dropoffRate = index > 0 ? 
                ((analytics.userFlow[index - 1]?.users || 0) - step.users) / 
                (analytics.userFlow[index - 1]?.users || 1) * 100 : 0;

              return (
                <div key={step.step} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{getStepLabel(step.step)}</p>
                        <p className="text-sm text-muted-foreground">
                          {step.users} utilisateurs
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {!isFirst && (
                        <div className="flex items-center gap-2">
                          <Badge variant={step.conversion_rate > 70 ? 'default' : step.conversion_rate > 40 ? 'secondary' : 'destructive'}>
                            {step.conversion_rate.toFixed(1)}%
                          </Badge>
                          {dropoffRate > 0 && (
                            <span className="text-sm text-red-600 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              -{dropoffRate.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isFirst && (
                    <Progress 
                      value={step.conversion_rate} 
                      className="w-full h-2"
                    />
                  )}

                  {/* Drop-off warning */}
                  {dropoffRate > 50 && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Attention:</strong> Forte perte d'utilisateurs ({dropoffRate.toFixed(1)}%) 
                        entre cette étape et la précédente. Optimisation recommandée.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Pages Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Pages les plus visitées
            </CardTitle>
            <CardDescription>
              Trafic par page sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPages.slice(0, 5).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{getPageLabel(page.page)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{page.visits}</span>
                    <Progress 
                      value={(page.visits / analytics.topPages[0]?.visits || 1) * 100} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Métriques de performance
            </CardTitle>
            <CardDescription>
              Temps de réponse et indicateurs techniques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Temps de chargement</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{analytics.performanceMetrics.avgLoadTime.toFixed(0)}ms</span>
                  <Badge variant={analytics.performanceMetrics.avgLoadTime < 2000 ? 'default' : 'destructive'}>
                    {analytics.performanceMetrics.avgLoadTime < 2000 ? 'Rapide' : 'Lent'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API moyenne</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{analytics.performanceMetrics.avgApiResponseTime.toFixed(0)}ms</span>
                  <Badge variant={analytics.performanceMetrics.avgApiResponseTime < 1000 ? 'default' : 'destructive'}>
                    {analytics.performanceMetrics.avgApiResponseTime < 1000 ? 'Optimal' : 'À optimiser'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taux de rebond</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{analytics.performanceMetrics.bounceRate.toFixed(1)}%</span>
                  <Badge variant={analytics.performanceMetrics.bounceRate < 40 ? 'default' : 'secondary'}>
                    {analytics.performanceMetrics.bounceRate < 40 ? 'Excellent' : 'Moyen'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper functions for labels
function getStepLabel(step: string): string {
  const labels: Record<string, string> = {
    pdf_upload: 'Upload PDF',
    data_extraction: 'Extraction IA',
    product_created: 'Produit créé',
    project_created: 'Projet créé',
    analysis_started: 'Analyse lancée',
    analysis_completed: 'Analyse terminée',
  };
  return labels[step] || step;
}

function getPageLabel(path: string): string {
  const labels: Record<string, string> = {
    '/': 'Accueil',
    '/products/new': 'Nouveau produit',
    '/products': 'Produits',
    '/projects': 'Projets',
    '/dashboard': 'Dashboard',
  };
  return labels[path] || path;
}