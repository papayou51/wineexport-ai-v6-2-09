import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Activity, 
  Settings, 
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { AnalyticsInsights } from '@/components/AnalyticsInsights';
import { ProductionMonitoring } from '@/components/ProductionMonitoring';

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date(),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Dashboard administrateur - WineExport AI Production
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Production
          </Badge>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export rapport
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">247</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% cette semaine
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Analyses complétées</p>
                <p className="text-2xl font-bold">1,832</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +24% vs mois dernier
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">97.3%</p>
                <Badge variant="default" className="text-xs">
                  Excellent
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alertes actives</p>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">
                  Budget et performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Utilisateur</CardTitle>
              <CardDescription>
                Analyse du comportement utilisateur et des conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsInsights dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <ProductionMonitoring />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration système</CardTitle>
                <CardDescription>
                  Paramètres globaux de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limite analyses simultanées</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded" 
                    defaultValue={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeout analyse (minutes)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded" 
                    defaultValue={15}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget mensuel maximal ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded" 
                    defaultValue={1000}
                  />
                </div>

                <Button className="w-full">
                  Sauvegarder la configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes et notifications</CardTitle>
                <CardDescription>
                  Configuration des alertes de production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alertes par email</span>
                  <input type="checkbox" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications Slack</span>
                  <input type="checkbox" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Rapport hebdomadaire</span>
                  <input type="checkbox" defaultChecked />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Seuil d'alerte erreur (%)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded" 
                    defaultValue={5}
                  />
                </div>

                <Button variant="outline" className="w-full">
                  Tester les alertes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;