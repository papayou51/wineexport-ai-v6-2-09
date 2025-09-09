import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  BarChart3,
  Users,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityTimelineProps {
  activities?: Array<{
    id: string;
    type: 'extraction' | 'analysis' | 'lead' | 'error';
    title: string;
    description: string;
    status: 'success' | 'error' | 'warning' | 'info';
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
}

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  // Données factices si pas de données
  const mockActivities = [
    {
      id: '1',
      type: 'extraction' as const,
      title: 'Extraction PDF réussie',
      description: 'Château Margaux 2020 - 95% qualité',
      status: 'success' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15min ago
      metadata: { provider: 'openai', quality: 95 }
    },
    {
      id: '2',
      type: 'analysis' as const,
      title: 'Analyse marché terminée',
      description: 'Marché français - 23 leads identifiés',
      status: 'success' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45min ago
      metadata: { country: 'FR', leads: 23 }
    },
    {
      id: '3',
      type: 'error' as const,
      title: 'Échec extraction',
      description: 'Timeout sur provider Anthropic',
      status: 'error' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2h ago
      metadata: { provider: 'anthropic' }
    },
    {
      id: '4',
      type: 'lead' as const,
      title: 'Nouveau lead qualifié',
      description: 'Cave Gourmet Paris - Score: 85%',
      status: 'info' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3h ago
      metadata: { score: 85 }
    },
  ];

  const data = activities || mockActivities;

  const getActivityIcon = (type: string, status: string) => {
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    
    switch (type) {
      case 'extraction': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'analysis': return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case 'lead': return <Users className="h-4 w-4 text-green-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
      error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
      info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
    };
    
    const labels = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Info',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.info}>
        {labels[status as keyof typeof labels] || 'Info'}
      </Badge>
    );
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {data.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card border-2 border-border">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  {index < data.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(activity.timestamp, { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};