import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  FolderOpen,
  Award,
  Clock
} from 'lucide-react';

interface PerformanceMetricsProps {
  performance: {
    extractionSuccessRate: number;
    avgResponseTime: number;
    leadsGenerated: number;
    activeProjects: number;
  };
}

export const PerformanceMetrics = ({ performance }: PerformanceMetricsProps) => {
  const metrics = [
    {
      title: 'Taux de succès IA',
      value: `${Math.round(performance.extractionSuccessRate)}%`,
      progress: performance.extractionSuccessRate,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Temps de réponse moy.',
      value: `${Math.round(performance.avgResponseTime / 1000)}s`,
      progress: Math.max(0, 100 - (performance.avgResponseTime / 1000) * 2), // Plus c'est rapide, mieux c'est
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Leads générés (7j)',
      value: performance.leadsGenerated.toString(),
      progress: Math.min(100, performance.leadsGenerated * 5), // Estimation: 20 leads = 100%
      icon: Target,
      color: 'text-wine-medium',
      bgColor: 'bg-wine-light/20'
    },
    {
      title: 'Projets actifs',
      value: performance.activeProjects.toString(),
      progress: Math.min(100, performance.activeProjects * 10), // Estimation: 10 projets = 100%
      icon: FolderOpen,
      color: 'text-gold',
      bgColor: 'bg-gold-light/20'
    }
  ];

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance & ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric) => (
            <div key={metric.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <span className="font-medium text-sm">{metric.title}</span>
                </div>
                <span className={`text-xl font-bold ${metric.color}`}>
                  {metric.value}
                </span>
              </div>
              <Progress value={metric.progress} className="h-2" />
            </div>
          ))}
        </div>

        {/* Résumé rapide */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>IA optimisée</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Performance en hausse</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};