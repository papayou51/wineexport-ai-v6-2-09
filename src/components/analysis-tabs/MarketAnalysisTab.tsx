import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Users, Globe } from 'lucide-react';
import { Analysis } from '@/hooks/useAnalyses';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface MarketAnalysisTabProps {
  analysis?: Analysis;
  countryCode: string;
}

export const MarketAnalysisTab: React.FC<MarketAnalysisTabProps> = ({
  analysis,
  countryCode,
}) => {
  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analyse de marché non disponible</h3>
            <p className="text-muted-foreground">
              L'analyse de marché pour {countryCode} n'a pas encore été réalisée.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = analysis.results || {};
  const marketSize = results.market_size || {};
  const competition = results.competition || {};
  const opportunities = results.opportunities || [];
  const trends = results.trends || [];

  // Sample data for charts - replace with real data from analysis.results
  const marketSizeData = [
    { name: '2022', value: marketSize.value_2022 || 120 },
    { name: '2023', value: marketSize.value_2023 || 135 },
    { name: '2024', value: marketSize.projected_2024 || 150 },
    { name: '2025', value: marketSize.projected_2025 || 165 },
  ];

  const competitionData = [
    { name: 'Leader du marché', value: 35, color: '#8884d8' },
    { name: 'Concurrents majeurs', value: 45, color: '#82ca9d' },
    { name: 'Niche disponible', value: 20, color: '#ffc658' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taille du marché</p>
                <p className="text-2xl font-bold">
                  {marketSize.current_value ? `${marketSize.current_value}M€` : '150M€'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Croissance annuelle</p>
                <p className="text-2xl font-bold">
                  {marketSize.growth_rate ? `+${marketSize.growth_rate}%` : '+12%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concurrents actifs</p>
                <p className="text-2xl font-bold">
                  {competition.active_competitors || '8'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Globe className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score d'opportunité</p>
                <p className="text-2xl font-bold">
                  {results.opportunity_score ? `${Math.round(results.opportunity_score * 100)}%` : '78%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution du marché</CardTitle>
            <CardDescription>Taille du marché en millions d'euros</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marketSizeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}M€`, 'Taille du marché']} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition concurrentielle</CardTitle>
            <CardDescription>Parts de marché disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={competitionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {competitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Opportunités identifiées</CardTitle>
            <CardDescription>Points d'entrée recommandés sur le marché</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.length > 0 ? opportunities.map((opportunity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {opportunity.priority || 'Moyen'}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">{opportunity.title || `Opportunité ${index + 1}`}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {opportunity.description || 'Description de l\'opportunité à exploiter'}
                    </p>
                    {opportunity.potential_revenue && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        Potentiel: {opportunity.potential_revenue}
                      </p>
                    )}
                  </div>
                </div>
              )) : (
                // Default opportunities when no data
                [
                  {
                    priority: 'Élevé',
                    title: 'Segment premium sous-exploité',
                    description: 'Le marché haut de gamme présente une demande non satisfaite avec des marges attractives.',
                    potential: '2.5M€'
                  },
                  {
                    priority: 'Moyen',
                    title: 'Canaux de distribution alternatifs',
                    description: 'Opportunité de développer les ventes en ligne et circuits spécialisés.',
                    potential: '1.8M€'
                  }
                ].map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant="outline" className="mt-0.5">
                      {opportunity.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{opportunity.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {opportunity.description}
                      </p>
                      <p className="text-sm font-medium text-green-600 mt-2">
                        Potentiel: {opportunity.potential}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendances du marché</CardTitle>
            <CardDescription>Évolutions à surveiller</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.length > 0 ? trends.map((trend: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{trend.title || `Tendance ${index + 1}`}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {trend.description || 'Description de la tendance'}
                    </p>
                    {trend.impact && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <Progress value={trend.impact * 20} className="h-2 w-20" />
                        <span className="text-xs">{trend.impact}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                // Default trends when no data
                [
                  {
                    title: 'Digitalisation des achats',
                    description: 'Accélération des ventes en ligne post-COVID avec +25% de croissance annuelle.',
                    impact: 4
                  },
                  {
                    title: 'Demande pour le bio et durable',
                    description: 'Forte croissance des produits éco-responsables, segment à +18% par an.',
                    impact: 5
                  },
                  {
                    title: 'Consolidation du marché',
                    description: 'Rachat des petits acteurs par les grands groupes, opportunités de partenariat.',
                    impact: 3
                  }
                ].map((trend, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{trend.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trend.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <Progress value={trend.impact * 20} className="h-2 w-20" />
                        <span className="text-xs">{trend.impact}/5</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};