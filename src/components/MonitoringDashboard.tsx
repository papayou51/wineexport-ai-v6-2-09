import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface ProbeResult {
  provider: "openai" | "anthropic" | "google";
  ok: boolean;
  status?: number | null;
  code?: string | null;
  message?: string;
  ms?: number;
}

interface HealthMetrics {
  success: boolean;
  windowDays: number;
  totalAnalyses: number;
  avgQuality: number | null;
  usage: {
    openai: number;
    anthropic: number;
    google: number;
    failed: number;
  };
  coverageRate: Record<string, number>;
  citationsRate: number;
  sample: Array<{ created_at: string; quality_score: number | null }>;
}

export function MonitoringDashboard() {
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Test providers
      const { data: selfTestData } = await supabase.functions.invoke('ai-self-test');
      if (selfTestData?.probes) {
        setProbes(selfTestData.probes);
      }

      // Get health metrics (30 days)
      const { data: healthData } = await supabase.functions.invoke('spec-health', {
        body: { days: 30 }
      });
      if (healthData?.success) {
        setHealth(healthData);
      }
    } catch (error: any) {
      toast({
        title: "Erreur de monitoring",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProviderStatus = (probe: ProbeResult) => {
    if (probe.ok) return { color: "success", icon: CheckCircle, text: "Opérationnel" };
    if (probe.code === "rate_limited") return { color: "warning", icon: Clock, text: "Quota atteint" };
    if (probe.code === "unauthorized") return { color: "destructive", icon: XCircle, text: "Clé invalide" };
    if (probe.code === "invalid_model") return { color: "destructive", icon: AlertTriangle, text: "Modèle invalide" };
    return { color: "destructive", icon: XCircle, text: "Erreur" };
  };

  const topFields = health ? 
    Object.entries(health.coverageRate)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Monitoring AI</h2>
        <Button 
          onClick={fetchData} 
          disabled={loading}
          variant="outline" 
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle>État des Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {probes.map((probe) => {
              const status = getProviderStatus(probe);
              const StatusIcon = status.icon;
              return (
                <div key={probe.provider} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-5 w-5 ${
                      status.color === 'success' ? 'text-success' :
                      status.color === 'warning' ? 'text-warning' : 'text-destructive'
                    }`} />
                    <div>
                      <p className="font-medium capitalize">{probe.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {probe.ms ? `${probe.ms}ms` : 'Timeout'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.color === 'success' ? 'default' : 'destructive'}>
                    {status.text}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {health && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Analyses (30j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.totalAnalyses}</div>
                <p className="text-xs text-muted-foreground">extractions PDF</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Qualité moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health.avgQuality ? `${health.avgQuality}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">score de confiance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.citationsRate}%</div>
                <p className="text-xs text-muted-foreground">avec références</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Échecs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{health.usage.failed}%</div>
                <p className="text-xs text-muted-foreground">analyses échouées</p>
              </CardContent>
            </Card>
          </div>

          {/* Provider Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>OpenAI</span>
                    <span>{health.usage.openai}%</span>
                  </div>
                  <Progress value={health.usage.openai} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Anthropic</span>
                    <span>{health.usage.anthropic}%</span>
                  </div>
                  <Progress value={health.usage.anthropic} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Google</span>
                    <span>{health.usage.google}%</span>
                  </div>
                  <Progress value={health.usage.google} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Coverage */}
          <Card>
            <CardHeader>
              <CardTitle>Couverture des Champs (Top 8)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {topFields.map(([field, coverage]) => (
                  <div key={field} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{field}</span>
                      <span>{coverage}%</span>
                    </div>
                    <Progress value={coverage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}