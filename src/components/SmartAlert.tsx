import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Globe, 
  BarChart3, 
  Zap,
  Lightbulb,
  Target,
  ArrowRight
} from "lucide-react";
import { useSmartSuggestions } from "@/hooks/useSmartSuggestions";

interface SmartAlertProps {
  context?: {
    page?: string;
    productId?: string;
    analysisId?: string;
  };
  maxSuggestions?: number;
  showOnlyHighPriority?: boolean;
  className?: string;
}

const iconMap = {
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Globe,
  BarChart3,
  Zap,
  Lightbulb,
  Target
};

const typeStyles = {
  action: {
    variant: "default" as const,
    className: "border-primary/20 bg-primary/5"
  },
  insight: {
    variant: "default" as const,
    className: "border-blue-500/20 bg-blue-50/50"
  },
  optimization: {
    variant: "default" as const,
    className: "border-orange-500/20 bg-orange-50/50"
  }
};

const priorityStyles = {
  high: "bg-red-500 text-white",
  medium: "bg-orange-500 text-white",
  low: "bg-gray-500 text-white"
};

export const SmartAlert: React.FC<SmartAlertProps> = ({
  context,
  maxSuggestions = 3,
  showOnlyHighPriority = false,
  className = ""
}) => {
  const { suggestions, hasHighPrioritySuggestions } = useSmartSuggestions(context);
  
  const filteredSuggestions = suggestions
    .filter(s => !showOnlyHighPriority || s.priority === 'high')
    .slice(0, maxSuggestions);

  if (filteredSuggestions.length === 0) {
    return null;
  }

  // Affichage compact pour le dashboard
  if (context?.page === 'dashboard' && filteredSuggestions.length === 1) {
    const suggestion = filteredSuggestions[0];
    const Icon = iconMap[suggestion.icon as keyof typeof iconMap] || Lightbulb;
    
    return (
      <Card className={`p-4 ${typeStyles[suggestion.type].className} ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-background/50">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{suggestion.title}</h4>
              <Badge 
                className={`${priorityStyles[suggestion.priority]} text-xs px-2 py-1`}
              >
                {suggestion.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
            {suggestion.action && (
              <Button
                size="sm"
                variant="outline"
                onClick={suggestion.action.onClick}
                asChild={!!suggestion.action.url}
                className="h-8"
              >
                {suggestion.action.url ? (
                  <a href={suggestion.action.url}>
                    {suggestion.action.label}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </a>
                ) : (
                  <>
                    {suggestion.action.label}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Affichage liste pour les autres contextes
  return (
    <div className={`space-y-4 ${className}`}>
      {hasHighPrioritySuggestions && (
        <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
          <AlertTriangle className="h-4 w-4" />
          Actions recommandées détectées
        </div>
      )}
      
      {filteredSuggestions.map((suggestion) => {
        const Icon = iconMap[suggestion.icon as keyof typeof iconMap] || Lightbulb;
        const styles = typeStyles[suggestion.type];
        
        return (
          <Alert key={suggestion.id} className={styles.className}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTitle className="text-base">{suggestion.title}</AlertTitle>
                  <Badge className={priorityStyles[suggestion.priority]}>
                    {suggestion.priority}
                  </Badge>
                </div>
                <AlertDescription className="mb-3">
                  {suggestion.description}
                </AlertDescription>
                
                {/* Données contextuelles */}
                {suggestion.data && (
                  <div className="mb-3 p-2 rounded bg-background/50 text-xs text-muted-foreground">
                    {suggestion.type === 'insight' && suggestion.data.markets && (
                      <div>
                        Marchés performants : {suggestion.data.markets.map((m: any) => m.country).join(', ')}
                      </div>
                    )}
                    {suggestion.data.products && (
                      <div>
                        {suggestion.data.products.length} produits concernés
                      </div>
                    )}
                  </div>
                )}
                
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant={suggestion.priority === 'high' ? 'default' : 'outline'}
                    onClick={suggestion.action.onClick}
                    asChild={!!suggestion.action.url}
                  >
                    {suggestion.action.url ? (
                      <a href={suggestion.action.url}>
                        {suggestion.action.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    ) : (
                      <>
                        {suggestion.action.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
};