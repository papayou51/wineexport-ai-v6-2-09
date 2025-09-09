import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  type?: 'network' | 'validation' | 'server' | 'permission' | 'generic';
  onRetry?: () => void;
  onSupport?: () => void;
  className?: string;
}

const errorConfigs = {
  network: {
    icon: RefreshCw,
    title: "Problème de connexion",
    suggestions: [
      "Vérifiez votre connexion internet",
      "Réessayez dans quelques instants",
      "Contactez votre administrateur réseau si le problème persiste"
    ]
  },
  validation: {
    icon: AlertTriangle,
    title: "Données invalides",
    suggestions: [
      "Vérifiez que tous les champs requis sont remplis",
      "Assurez-vous que le format des données est correct",
      "Consultez l'aide pour plus d'informations"
    ]
  },
  server: {
    icon: AlertTriangle,
    title: "Erreur serveur",
    suggestions: [
      "Le service est temporairement indisponible",
      "Réessayez dans quelques minutes",
      "Contactez le support si l'erreur persiste"
    ]
  },
  permission: {
    icon: AlertTriangle,
    title: "Accès refusé",
    suggestions: [
      "Vous n'avez pas les permissions nécessaires",
      "Connectez-vous avec un compte autorisé",
      "Contactez votre administrateur pour obtenir l'accès"
    ]
  },
  generic: {
    icon: AlertTriangle,
    title: "Une erreur est survenue",
    suggestions: [
      "Réessayez l'opération",
      "Rafraîchissez la page",
      "Contactez le support si le problème persiste"
    ]
  }
};

export const ErrorMessage = ({ 
  title, 
  message, 
  type = 'generic', 
  onRetry, 
  onSupport,
  className 
}: ErrorMessageProps) => {
  const config = errorConfigs[type];
  const Icon = config.icon;

  return (
    <Card className={`border-destructive/20 bg-destructive/5 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Icon className="h-5 w-5" />
          {title || config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Suggestions :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {config.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          )}
          
          {onSupport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSupport}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Contacter le support
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook pour gérer les erreurs avec types
export const useErrorMessage = () => {
  const getErrorType = (error: any): 'network' | 'validation' | 'server' | 'permission' | 'generic' => {
    if (!error) return 'generic';
    
    const message = error.message || error.toString().toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
      return 'validation';
    }
    
    if (message.includes('500') || message.includes('server') || message.includes('internal')) {
      return 'server';
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('permission')) {
      return 'permission';
    }
    
    return 'generic';
  };

  return { getErrorType };
};