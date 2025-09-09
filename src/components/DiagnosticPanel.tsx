import React from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DiagnosticInfo {
  extractionType?: string;
  fallbackContext?: {
    reason: string;
    originalError: string;
    recommendedAction?: string;
    attemptDetails?: any[];
  };
  qualityScore?: number;
  qualityIssues?: string[];
}

interface DiagnosticPanelProps {
  diagnosticInfo: DiagnosticInfo;
  onRetry?: () => void;
}

export const DiagnosticPanel = ({ diagnosticInfo, onRetry }: DiagnosticPanelProps) => {
  const { extractionType, fallbackContext, qualityScore = 0, qualityIssues = [] } = diagnosticInfo;

  const getDiagnosticLevel = () => {
    if (qualityScore < 15) return 'error';
    if (qualityScore < 40) return 'warning';
    return 'success';
  };

  const getDiagnosticIcon = () => {
    const level = getDiagnosticLevel();
    switch (level) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <HelpCircle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (extractionType === 'text_fallback' && fallbackContext) {
      if (fallbackContext.reason === 'pdf_fetch_failed') {
        recommendations.push({
          title: "Problème d'accès au fichier",
          description: fallbackContext.recommendedAction || "Vérifiez que le fichier est accessible",
          action: "Réessayer l'upload"
        });
      }
    }

    if (qualityScore < 15) {
      recommendations.push({
        title: "Données insuffisantes",
        description: "Le document semble être vide ou illisible",
        action: "Utiliser un PDF avec plus de contenu textuel"
      });
    }

    if (qualityIssues.some(issue => issue.includes('nom de fichier'))) {
      recommendations.push({
        title: "Extraction basique détectée", 
        description: "Seules les informations du nom de fichier ont pu être extraites",
        action: "Vérifier que le PDF contient du texte lisible"
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getDiagnosticIcon()}
          Diagnostic d'extraction
          <Badge variant={getDiagnosticLevel() === 'error' ? 'destructive' : 'secondary'}>
            {qualityScore}% qualité
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Issues */}
        {qualityIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Problèmes détectés:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {qualityIssues.slice(0, 3).map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Details */}
        {fallbackContext && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Détails techniques:</h4>
            <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded text-xs">
              <p><strong>Type:</strong> {extractionType || 'Inconnu'}</p>
              <p><strong>Raison:</strong> {fallbackContext.reason}</p>
              {fallbackContext.originalError && (
                <p><strong>Erreur:</strong> {fallbackContext.originalError}</p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recommandations:</h4>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    {rec.title}
                  </h5>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {rec.description}
                  </p>
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mt-2">
                    → {rec.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              Réessayer
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => window.open('https://docs.lovable.dev/tips-tricks/troubleshooting', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Guide de dépannage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};