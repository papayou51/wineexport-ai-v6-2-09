import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Activity, Clock, Target, TrendingUp, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ExtractionMetrics } from '@/hooks/useExtractionMonitoring';
import { ProviderBadges } from "@/components/ProviderBadge";
import { format } from 'date-fns';

interface ExtractionMonitoringPanelProps {
  organizationId: string;
  metrics?: ExtractionMetrics;
  providerStatus?: Record<string, string>;
  isLoading?: boolean;
}

export const ExtractionMonitoringPanel = ({ 
  organizationId, 
  metrics: passedMetrics, 
  providerStatus: passedProviderStatus, 
  isLoading: passedIsLoading 
}: ExtractionMonitoringPanelProps) => {
  // Use passed props if available, otherwise default values
  const metrics = passedMetrics || {
    totalExtractions: 0,
    successRate: 0,
    averageQuality: 0,
    averageTime: 0,
    providerUsage: { anthropic: 0, google: 0, openai: 0, fallback: 0 },
    recentExtractions: []
  };
  
  const providerStatus = passedProviderStatus || {
    anthropic: 'unknown',
    google: 'unknown', 
    openai: 'unknown',
    fallback: 'unknown'
  };
  
  const isLoading = passedIsLoading || false;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoring des Extractions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'anthropic': return '🤖';
      case 'google': return '🧠';
      case 'openai': return '🚀';
      default: return '📄';
    }
  };

  const getProviderStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Opérationnel</Badge>;
      case 'error':
        return <Badge variant="destructive">✗ Erreur</Badge>;
      default:
        return <Badge variant="outline">? Inconnu</Badge>;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monitoring des Extractions IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métriques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{metrics.totalExtractions}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Succès</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getQualityColor(metrics.averageQuality)}`}>
              {metrics.averageQuality.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Qualité</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(metrics.averageTime / 1000).toFixed(1)}s
            </div>
            <div className="text-sm text-muted-foreground">Temps</div>
          </div>
        </div>

        <Separator />

        {/* Status des providers */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Status des Providers IA
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="font-medium">Anthropic</span>
              </div>
              {getProviderStatusBadge(providerStatus.anthropic)}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <span className="font-medium">Google</span>
              </div>
              {getProviderStatusBadge(providerStatus.google)}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="font-medium">OpenAI</span>
              </div>
              {getProviderStatusBadge(providerStatus.openai)}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-medium">Fallback</span>
              </div>
              {getProviderStatusBadge(providerStatus.fallback)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Usage des providers */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Répartition d'Usage
          </h4>
          <div className="space-y-3">
            {Object.entries(metrics.providerUsage).map(([provider, percentage]) => (
              <div key={provider} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{getProviderIcon(provider)}</span>
                    <span className="capitalize">{provider}</span>
                  </span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Extractions récentes */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Extractions Récentes
          </h4>
        <div className="space-y-4">
          {metrics.recentExtractions.slice(0, 5).map((extraction) => (
            <div key={extraction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {extraction.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{extraction.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(extraction.timestamp, 'dd/MM/yyyy HH:mm')}
                  </p>
                  {extraction.providers?.runs && (
                    <div className="mt-1">
                      <ProviderBadges runs={extraction.providers.runs} />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {extraction.success && extraction.qualityScore && (
                  <div className={`text-sm font-medium ${getQualityColor(extraction.qualityScore)}`}>
                    {extraction.qualityScore}%
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {Math.round(extraction.extractionTime)}ms
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </CardContent>
    </Card>
  );
};