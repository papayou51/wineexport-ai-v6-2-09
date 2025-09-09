import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSecuritySystemTest } from '@/hooks/useSecuritySystemTest';

export const SecuritySystemTest = () => {
  const { status, loading, retestSystem } = useSecuritySystemTest();

  const getStatusIcon = (isWorking: boolean) => {
    return isWorking ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (isWorking: boolean) => {
    return (
      <Badge variant={isWorking ? "default" : "destructive"}>
        {isWorking ? 'Fonctionnel' : 'Erreur'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Test du Système de Sécurité
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Vérification de l'état des composants de sécurité avancée
            </p>
          </div>
          <Button 
            onClick={retestSystem} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-tester
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.geographicRules)}
              <span className="text-sm font-medium">Règles Géographiques</span>
            </div>
            {getStatusBadge(status.geographicRules)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.trustedDevices)}
              <span className="text-sm font-medium">Appareils de Confiance</span>
            </div>
            {getStatusBadge(status.trustedDevices)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.securityIncidents)}
              <span className="text-sm font-medium">Incidents de Sécurité</span>
            </div>
            {getStatusBadge(status.securityIncidents)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.intelligentSecurity)}
              <span className="text-sm font-medium">Sécurité Intelligente</span>
            </div>
            {getStatusBadge(status.intelligentSecurity)}
          </div>
        </div>

        {status.errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Erreurs détectées :
            </h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {status.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Test en cours...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};