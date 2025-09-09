import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useStats';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { AIStatusWidget } from '@/components/dashboard/AIStatusWidget';
import { GeographicOverview } from '@/components/dashboard/GeographicOverview';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { SmartActions } from '@/components/dashboard/SmartActions';
import { ExtractionTrendsChart } from '@/components/dashboard/ExtractionTrendsChart';
import { ProviderUsageChart } from '@/components/dashboard/ProviderUsageChart';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { QualityTrendChart } from '@/components/dashboard/QualityTrendChart';
import { MarketingIntelligenceWidget } from '@/components/dashboard/MarketingIntelligenceWidget';
import { SmartAlert } from '@/components/SmartAlert';
import { useMarketingIntelligenceAlerts } from '@/hooks/useMarketingIntelligenceAlerts';
import { 
  Wine, 
  Globe, 
  BarChart3, 
  FileText, 
  Plus,
  Package,
  Target,
  TrendingUp,
  FolderOpen,
  Activity,
  Zap,
  Lightbulb,
  Sparkles
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  
  // Activer les alertes intelligentes
  useMarketingIntelligenceAlerts();

  if (statsLoading || metricsLoading) {
    return <LoadingSkeleton variant="card" count={8} className="container mx-auto px-4 py-8" />;
  }

  const quickActions = [
    {
      title: 'Nouveau produit',
      description: 'Ajouter un vin à votre catalogue',
      icon: Plus,
      href: '/products/new',
      color: 'bg-primary'
    },
    {
      title: 'Nouveau projet',
      description: 'Créer un projet d\'export',
      icon: FolderOpen,
      href: '/projects/new',
      color: 'bg-accent'
    },
    {
      title: 'Outils Marketing',
      description: 'Contenus et budgets marketing',
      icon: Sparkles,
      href: '/marketing-tools',
      color: 'bg-wine-deep'
    },
    {
      title: 'Voir mes projets',
      description: 'Gérer vos projets d\'export',
      icon: FileText,
      href: '/projects',
      color: 'bg-wine-medium'
    }
  ];

  const dashboardStats = [
    {
      title: 'Produits',
      value: statsLoading ? '...' : stats?.products?.toString() || '0',
      icon: Wine,
      trend: 'Total enregistré'
    },
    {
      title: 'Projets',
      value: statsLoading ? '...' : stats?.projects?.toString() || '0',
      icon: FolderOpen,
      trend: 'En cours ou terminés'
    },
    {
      title: 'Analyses',
      value: statsLoading ? '...' : stats?.analyses?.toString() || '0',
      icon: BarChart3,
      trend: 'Analyses effectuées'
    },
    {
      title: 'Leads',
      value: statsLoading ? '...' : stats?.leads?.toString() || '0',
      icon: Target,
      trend: 'Prospects identifiés'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Bienvenue, {user?.email}
              </p>
            </div>
            <Link to="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Alertes intelligentes */}
        <SmartAlert 
          context={{ page: 'dashboard' }}
          maxSuggestions={1}
          showOnlyHighPriority={true}
          className="mb-6"
        />

        {/* Quick Actions - Section prioritaire */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Overview - Métriques clés */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.trend}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Navigation rapide - Accès direct */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Navigation rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/products">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Mes produits</CardTitle>
                      <CardDescription>
                        Gérer votre catalogue de vins
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/projects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Mes projets</CardTitle>
                      <CardDescription>
                        Gérer vos projets d'export
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>

        {/* Section État IA & Performance - Monitoring technique */}
        {metrics && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Monitoring Temps Réel
              </h2>
              <Link to="/monitoring">
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Monitoring complet
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AIStatusWidget 
                providerStatus={metrics.aiProviderStatus}
                recentExtractions={metrics.recentExtractions}
              />
              <GeographicOverview topCountries={metrics.topCountries} />
              <MarketingIntelligenceWidget />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsPanel alerts={metrics.alerts} />
              <SmartActions 
                alerts={metrics.alerts}
                performance={metrics.performance}
              />
            </div>
            
            <PerformanceMetrics performance={metrics.performance} />
          </section>
        )}

        {/* Section Graphiques et Tendances - Analyse détaillée */}
        {metrics && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Analyse et Tendances
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExtractionTrendsChart />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProviderUsageChart />
                <QualityTrendChart />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActivityTimeline />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;