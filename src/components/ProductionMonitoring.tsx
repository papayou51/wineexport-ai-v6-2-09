import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Server,
  Zap,
  TrendingUp,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
}

interface CostMetrics {
  totalSpent: number;
  dailyAverage: number;
  breakdown: {
    openai: number;
    anthropic: number;
    google: number;
    storage: number;
  };
  projectedMonthly: number;
}

interface PerformanceMetrics {
  avgAnalysisTime: number;
  successRate: number;
  queueLength: number;
  throughput: number;
}

export const ProductionMonitoring: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Refresh monitoring data
  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Fetch system health
      const healthResponse = await fetch('/api/monitoring/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemHealth(health);
      }

      // Fetch cost metrics from Supabase
      const { data: analysesData } = await supabase
        .from('analyses')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (analysesData) {
        // Calculate cost metrics from analyses data
        const costs = calculateCostMetrics(analysesData);
        setCostMetrics(costs);
      }

      // Fetch performance metrics
      const { data: performanceData } = await supabase
        .from('analyses')
        .select('analysis_type, created_at, completed_at, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (performanceData) {
        const performance = calculatePerformanceMetrics(performanceData);
        setPerformanceMetrics(performance);
      }

      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error refreshing monitoring data:', error);
      toast({
        title: "Erreur de monitoring",
        description: "Impossible de récupérer les données de monitoring",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Production</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel du système WineExport AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Dernière MAJ: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${getHealthColor(systemHealth.status)}`}>
                  {React.createElement(getHealthIcon(systemHealth.status), { 
                    className: "h-6 w-6" 
                  })}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">État système</p>
                  <p className="text-2xl font-bold capitalize">{systemHealth.status}</p>
                  <p className="text-xs text-muted-foreground">
                    Uptime: {(systemHealth.uptime * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temps de réponse</p>
                  <p className="text-2xl font-bold">{systemHealth.responseTime}ms</p>
                  <Progress 
                    value={Math.max(0, 100 - (systemHealth.responseTime / 50))} 
                    className="w-16 h-2 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold">{systemHealth.activeUsers}</p>
                  <p className="text-xs text-muted-foreground">
                    Erreurs: {systemHealth.errorRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Server className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                      {systemHealth.status === 'healthy' ? 'Optimal' : 'Dégradé'}
                    </Badge>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Monitoring */}
      {costMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Coûts IA et Infrastructure
            </CardTitle>
            <CardDescription>
              Suivi des dépenses en temps réel et projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total (7 jours)</p>
                <p className="text-3xl font-bold">${costMetrics.totalSpent.toFixed(2)}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Moyenne: ${costMetrics.dailyAverage.toFixed(2)}/jour
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Projection mensuelle</p>
                <p className="text-2xl font-bold">${costMetrics.projectedMonthly.toFixed(0)}</p>
                <Progress value={(costMetrics.projectedMonthly / 1000) * 100} className="h-2" />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">Répartition par provider</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>OpenAI</span>
                    <span className="font-medium">${costMetrics.breakdown.openai.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Anthropic</span>
                    <span className="font-medium">${costMetrics.breakdown.anthropic.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Google</span>
                    <span className="font-medium">${costMetrics.breakdown.google.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Stockage</p>
                <p className="text-xl font-bold">${costMetrics.breakdown.storage.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">PDF + Données</p>
              </div>
            </div>

            {costMetrics.projectedMonthly > 800 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alerte coût:</strong> La projection mensuelle dépasse le budget prévu. 
                  Optimisation recommandée.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Analytics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance des Analyses
              </CardTitle>
              <CardDescription>
                Métriques de performance sur les dernières 24h
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Temps moyen</p>
                  <p className="text-2xl font-bold">
                    {Math.round(performanceMetrics.avgAnalysisTime / 60)}min
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux de succès</p>
                  <p className="text-2xl font-bold text-green-600">
                    {performanceMetrics.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">File d'attente</span>
                  <Badge variant={performanceMetrics.queueLength > 10 ? 'destructive' : 'default'}>
                    {performanceMetrics.queueLength} analyses
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Débit</span>
                  <span className="font-bold">{performanceMetrics.throughput} analyses/h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes & Monitoring
              </CardTitle>
              <CardDescription>
                Configuration des alertes de production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Analyses en échec {'>'} 5%</span>
                  </div>
                  <Badge variant="outline">Actif</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Temps de réponse {'>'} 3s</span>
                  </div>
                  <Badge variant="outline">Actif</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Budget mensuel {'>'} $800</span>
                  </div>
                  <Badge variant="secondary">Surveillance</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Service indisponible</span>
                  </div>
                  <Badge variant="destructive">Critique</Badge>
                </div>
              </div>

              <Separator />

              <Button variant="outline" className="w-full gap-2">
                <Settings className="h-4 w-4" />
                Configurer les alertes
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper functions
function calculateCostMetrics(analyses: any[]): CostMetrics {
  // Mock calculation - would integrate with actual cost tracking
  const totalCosts = analyses.length * 0.15; // Average cost per analysis
  
  return {
    totalSpent: totalCosts,
    dailyAverage: totalCosts / 7,
    breakdown: {
      openai: totalCosts * 0.6,
      anthropic: totalCosts * 0.3,
      google: totalCosts * 0.08,
      storage: totalCosts * 0.02,
    },
    projectedMonthly: (totalCosts / 7) * 30,
  };
}

function calculatePerformanceMetrics(analyses: any[]): PerformanceMetrics {
  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const avgTime = completedAnalyses.reduce((sum, a) => {
    const start = new Date(a.created_at);
    const end = new Date(a.completed_at);
    return sum + (end.getTime() - start.getTime()) / 1000;
  }, 0) / (completedAnalyses.length || 1);

  return {
    avgAnalysisTime: avgTime,
    successRate: (completedAnalyses.length / analyses.length) * 100,
    queueLength: analyses.filter(a => a.status === 'processing').length,
    throughput: analyses.length, // Simplified
  };
}