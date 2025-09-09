import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Zap
} from 'lucide-react';

interface AIStatusWidgetProps {
  providerStatus: {
    openai: 'operational' | 'degraded' | 'down';
    anthropic: 'operational' | 'degraded' | 'down';
    google: 'operational' | 'degraded' | 'down';
  };
  recentExtractions: {
    total: number;
    success: number;
    failed: number;
    avgQuality: number;
    avgProcessingTime: number;
  };
}

export const AIStatusWidget = ({ providerStatus, recentExtractions }: AIStatusWidgetProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Bot className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'down': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'degraded': return 'Dégradé';
      case 'down': return 'Hors service';
      default: return 'Inconnu';
    }
  };

  const successRate = recentExtractions.total > 0 
    ? Math.round((recentExtractions.success / recentExtractions.total) * 100)
    : 0;

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          État des Providers IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status des providers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(providerStatus).map(([provider, status]) => (
            <div key={provider} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="font-medium capitalize">{provider}</span>
              </div>
              <Badge className={getStatusColor(status)}>
                {getStatusLabel(status)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Métriques récentes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{recentExtractions.total}</div>
            <div className="text-sm text-muted-foreground">Extractions (7j)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <div className="text-sm text-muted-foreground">Taux de succès</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{Math.round(recentExtractions.avgQuality)}%</span>
            </div>
            <div className="text-sm text-muted-foreground">Qualité moy.</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{Math.round(recentExtractions.avgProcessingTime / 1000)}s</span>
            </div>
            <div className="text-sm text-muted-foreground">Temps moy.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};