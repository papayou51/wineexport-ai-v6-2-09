import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import GeographicMap from './GeographicMap';
import { useGeographicAnalysis, useGeographicInsights } from '@/hooks/useGeographicData';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { 
  Globe, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building, 
  AlertTriangle,
  Download,
  Target,
  BarChart3,
  MapPin,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface GeographicDashboardProps {
  projectId: string;
}

const GeographicDashboard: React.FC<GeographicDashboardProps> = ({ projectId }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { data: analyses, isLoading: analysesLoading } = useGeographicAnalysis(projectId);
  const { data: insights, isLoading: insightsLoading } = useGeographicInsights(projectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (value < threshold) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (analysesLoading || insightsLoading) {
    return <LoadingSkeleton variant="card" count={6} className="container mx-auto p-6" />;
  }

  const selectedAnalysis = selectedCountry 
    ? analyses?.find(a => a.country_code === selectedCountry)
    : null;

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marchés analysés</p>
                <p className="text-2xl font-bold">{analyses?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pays ciblés</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taille totale du marché</p>
                <p className="text-2xl font-bold">
                  {insights ? formatCurrency(insights.totalMarketSize) : '$0'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {getTrendIcon(5.2)} +5.2% croissance
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score moyen</p>
                <p className="text-2xl font-bold">
                  {insights ? Math.round(insights.avgMarketScore) : 0}/100
                </p>
                <p className="text-xs text-muted-foreground">Potentiel marché</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complexité réglementaire</p>
                <p className="text-2xl font-bold">
                  {insights ? Math.round(insights.regulatoryComplexity) : 0}/10
                </p>
                <p className="text-xs text-muted-foreground">Score moyen</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Map */}
        <div className="lg:col-span-2">
          <GeographicMap
            onCountrySelect={setSelectedCountry}
            selectedCountries={selectedCountry ? [selectedCountry] : []}
          />
        </div>

        {/* Top Markets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Marchés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights?.topMarkets.map((market, index) => (
              <div 
                key={market.country_code}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                  selectedCountry === market.country_code ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => setSelectedCountry(market.country_code)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{market.country_code}</span>
                  </div>
                  <Badge className={getScoreColor(market.score)}>
                    {Math.round(market.score)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span>{Math.round(market.score)}/100</span>
                  </div>
                  <Progress value={market.score} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Marché: {formatCurrency(market.market_size)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      {selectedAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Analyse détaillée - {selectedAnalysis.country_code}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="demographics">Démographie</TabsTrigger>
                <TabsTrigger value="market">Marché</TabsTrigger>
                <TabsTrigger value="regulatory">Réglementation</TabsTrigger>
                <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{selectedAnalysis.market_score}/100</div>
                    <div className="text-sm text-muted-foreground">Score global</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedAnalysis.market_potential?.market_size_usd || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Taille du marché</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">
                      {formatNumber(selectedAnalysis.demographic_data?.population || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Population</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="demographics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Population totale</span>
                    <div className="text-2xl font-bold">
                      {formatNumber(selectedAnalysis.demographic_data?.population || 0)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">PIB par habitant</span>
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedAnalysis.demographic_data?.gdp_per_capita || 0)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Population urbaine</span>
                    <div className="text-2xl font-bold">
                      {selectedAnalysis.demographic_data?.urban_population_percent || 0}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Âge médian</span>
                    <div className="text-2xl font-bold">
                      {selectedAnalysis.demographic_data?.median_age || 0} ans
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Taille du marché</span>
                      <div className="text-2xl font-bold">
                        {formatCurrency(selectedAnalysis.market_potential?.market_size_usd || 0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Consommation/habitant</span>
                      <div className="text-2xl font-bold">
                        {selectedAnalysis.market_potential?.wine_consumption_per_capita || 0}L
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Paysage concurrentiel</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sensibilité au prix</span>
                        <Badge variant="outline">
                          {selectedAnalysis.competitive_landscape?.price_sensitivity || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fidélité à la marque</span>
                        <Badge variant="outline">
                          {selectedAnalysis.competitive_landscape?.brand_loyalty || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="regulatory" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Score de complexité</span>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                          {selectedAnalysis.regulatory_environment?.complexity_score || 0}/10
                        </div>
                        <Progress 
                          value={(selectedAnalysis.regulatory_environment?.complexity_score || 0) * 10} 
                          className="flex-1" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Droits d'importation</span>
                      <div className="text-2xl font-bold">
                        {selectedAnalysis.regulatory_environment?.import_duties_percent || 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Délai de conformité</span>
                    <div className="text-2xl font-bold">
                      {selectedAnalysis.regulatory_environment?.compliance_timeline_days || 0} jours
                    </div>
                  </div>
                  
                  {selectedAnalysis.regulatory_environment?.certification_requirements && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Certifications requises</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.regulatory_environment.certification_requirements.map((cert, index) => (
                          <Badge key={index} variant="secondary">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <div className="space-y-6">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-medium text-primary mb-2">Stratégie d'entrée recommandée</h4>
                    <p className="text-sm">
                      {selectedAnalysis.recommendations?.entry_strategy || 'Aucune recommandation disponible'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Fourchette de prix recommandée</span>
                      <div className="text-lg font-bold">
                        {selectedAnalysis.recommendations?.recommended_price_range ? 
                          `$${selectedAnalysis.recommendations.recommended_price_range.min} - $${selectedAnalysis.recommendations.recommended_price_range.max}` :
                          'Non définie'
                        }
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Investissement requis</span>
                      <div className="text-lg font-bold">
                        {formatCurrency(selectedAnalysis.recommendations?.investment_required_usd || 0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Timeline</span>
                      <div className="text-lg font-bold">
                        {selectedAnalysis.recommendations?.timeline_months || 0} mois
                      </div>
                    </div>
                  </div>
                  
                  {selectedAnalysis.recommendations?.marketing_channels && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Canaux marketing recommandés</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.recommendations.marketing_channels.map((channel, index) => (
                          <Badge key={index} variant="outline">{channel}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Actions rapides</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Rapport PDF
              </Button>
              <Button size="sm">
                Nouvelle analyse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeographicDashboard;