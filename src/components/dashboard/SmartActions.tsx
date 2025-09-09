import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Lightbulb, 
  AlertCircle, 
  PlayCircle, 
  FileSearch,
  TrendingUp,
  Target,
  ArrowRight
} from 'lucide-react';

interface SmartActionsProps {
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
  }>;
  performance: {
    extractionSuccessRate: number;
    avgResponseTime: number;
    leadsGenerated: number;
    activeProjects: number;
  };
}

export const SmartActions = ({ alerts, performance }: SmartActionsProps) => {
  // Générer des suggestions intelligentes basées sur les données
  const generateSuggestions = () => {
    const suggestions = [];

    // Suggestions basées sur les performances
    if (performance.extractionSuccessRate < 80) {
      suggestions.push({
        id: 'improve-extraction',
        title: 'Améliorer la qualité d\'extraction',
        description: 'Analyser les échecs récents pour optimiser les prompts IA',
        action: 'Voir les diagnostics',
        href: '/monitoring',
        icon: FileSearch,
        priority: 'high',
        color: 'text-red-600'
      });
    }

    if (performance.leadsGenerated < 5) {
      suggestions.push({
        id: 'generate-leads',
        title: 'Générer plus de prospects',
        description: 'Lancer des analyses sur de nouveaux marchés cibles',
        action: 'Nouveau projet',
        href: '/projects/new',
        icon: Target,
        priority: 'medium',
        color: 'text-wine-medium'
      });
    }

    if (performance.activeProjects === 0) {
      suggestions.push({
        id: 'start-project',
        title: 'Démarrer votre premier projet',
        description: 'Créer un projet d\'export pour analyser vos marchés',
        action: 'Créer un projet',
        href: '/projects/new',
        icon: PlayCircle,
        priority: 'high',
        color: 'text-primary'
      });
    }

    // Suggestions basées sur les alertes
    if (alerts.filter(a => a.type === 'error').length > 0) {
      suggestions.push({
        id: 'fix-errors',
        title: 'Résoudre les erreurs techniques',
        description: 'Des problèmes techniques nécessitent votre attention',
        action: 'Voir les erreurs',
        href: '/monitoring',
        icon: AlertCircle,
        priority: 'high',
        color: 'text-red-600'
      });
    }

    // Suggestions générales
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'optimize-workflow',
        title: 'Optimiser votre workflow',
        description: 'Découvrir de nouvelles fonctionnalités pour améliorer vos exports',
        action: 'Explorer',
        href: '/products',
        icon: TrendingUp,
        priority: 'low',
        color: 'text-primary'
      });
    }

    return suggestions.slice(0, 3); // Limiter à 3 suggestions
  };

  const suggestions = generateSuggestions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Actions Intelligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1">
                <div className="p-2 rounded-lg bg-muted/50">
                  <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <Badge className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority === 'high' ? 'Urgent' : 
                       suggestion.priority === 'medium' ? 'Important' : 'Suggestion'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                </div>
              </div>
              <Link to={suggestion.href}>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  {suggestion.action}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {/* Actions rapides additionnelles */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Link to="/products/new">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <PlayCircle className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </Link>
            <Link to="/monitoring">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileSearch className="h-4 w-4 mr-2" />
                Monitoring
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};