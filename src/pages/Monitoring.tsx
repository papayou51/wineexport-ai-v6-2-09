import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import AIExtractionHistory from "@/components/AIExtractionHistory";
import { Card, CardContent } from "@/components/ui/card";

export default function Monitoring() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Monitoring & Performance</h1>
        <p className="text-muted-foreground">
          Surveillez les performances de l'extraction AI et l'état des providers
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Mode LLM-Only Activé</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Extraction multi-providers avec fusion intelligente et validation Zod
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MonitoringDashboard />
      
      <AIExtractionHistory days={30} recentLimit={20} />
    </div>
  );
}