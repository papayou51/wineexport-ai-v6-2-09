import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, Target, Lightbulb, Palette, MessageCircle, TrendingUp, Star, Users } from 'lucide-react';
import { Analysis } from '@/hooks/useAnalyses';

interface MarketingIntelligenceTabProps {
  analysis?: Analysis;
  countryCode: string;
}

export const MarketingIntelligenceTab: React.FC<MarketingIntelligenceTabProps> = ({
  analysis,
  countryCode,
}) => {
  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Intelligence marketing non disponible</h3>
            <p className="text-muted-foreground">
              L'analyse d'intelligence marketing pour {countryCode} n'a pas encore été réalisée.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = analysis.results || {};
  const positioning = results.positioning || {};
  const messaging = results.messaging || {};
  const channels = results.channels || [];
  const recommendations = results.recommendations || [];

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'élevé':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'medium':
      case 'moyen':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low':
      case 'faible':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'social':
      case 'réseaux sociaux':
        return <MessageCircle className="h-4 w-4" />;
      case 'digital':
      case 'numérique':
        return <TrendingUp className="h-4 w-4" />;
      case 'traditional':
      case 'traditionnel':
        return <Star className="h-4 w-4" />;
      case 'retail':
      case 'vente au détail':
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de positionnement</p>
                <p className="text-2xl font-bold">
                  {positioning.score ? `${Math.round(positioning.score * 100)}%` : '85%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Lightbulb className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recommandations</p>
                <p className="text-2xl font-bold">{recommendations.length || '12'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canaux prioritaires</p>
                <p className="text-2xl font-bold">{channels.length || '5'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Positioning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Positionnement de marque
          </CardTitle>
          <CardDescription>
            Stratégie de positionnement recommandée pour {countryCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Proposition de valeur unique</h4>
                <p className="text-sm text-muted-foreground">
                  {positioning.value_proposition || 
                    "Vins français authentiques et terroir d'exception, alliant tradition familiale et innovation moderne pour une expérience gustative unique."
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Public cible principal</h4>
                <p className="text-sm text-muted-foreground">
                  {positioning.target_audience || 
                    "Professionnels de l'hôtellerie-restauration et amateurs éclairés de 35-55 ans, recherchant des produits premium authentiques."
                  }
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Différenciateurs clés</h4>
                <div className="space-y-2">
                  {(positioning.differentiators || [
                    'Terroir unique et AOC protégée',
                    'Méthodes traditionnelles certifiées',
                    'Gamme bio et développement durable',
                    'Service personnalisé et expertise'
                  ]).map((diff: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Canaux marketing recommandés
          </CardTitle>
          <CardDescription>
            Mix marketing optimal pour pénétrer le marché {countryCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(channels.length > 0 ? channels : [
              {
                name: 'Réseaux sociaux professionnels',
                effectiveness: 85,
                investment: 'Moyen',
                description: 'LinkedIn et Instagram pour cibler les professionnels'
              },
              {
                name: 'Salons professionnels',
                effectiveness: 90,
                investment: 'Élevé',
                description: 'Participation aux foires vinicoles locales'
              },
              {
                name: 'Marketing digital ciblé',
                effectiveness: 75,
                investment: 'Faible',
                description: 'Google Ads et SEO local'
              },
              {
                name: 'Partenariats distributeurs',
                effectiveness: 80,
                investment: 'Moyen',
                description: 'Collaboration avec importateurs établis'
              }
            ]).map((channel: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel.type || channel.name)}
                    <h4 className="font-medium">{channel.name}</h4>
                  </div>
                  <Badge variant="outline">
                    {channel.investment || 'Moyen'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {channel.description}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Efficacité</span>
                    <span className="font-medium">{channel.effectiveness}%</span>
                  </div>
                  <Progress value={channel.effectiveness} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messaging Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Stratégie de communication
          </CardTitle>
          <CardDescription>
            Messages clés et tonalité pour {countryCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Messages principaux</h4>
                <div className="space-y-3">
                  {(messaging.key_messages || [
                    {
                      message: "L'excellence française à votre table",
                      context: "Slogan principal"
                    },
                    {
                      message: "Tradition, qualité et innovation depuis 1850",
                      context: "Héritage"
                    },
                    {
                      message: "Partenaire de confiance des meilleurs chefs",
                      context: "Crédibilité"
                    }
                  ]).map((msg: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{msg.context}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Tonalité recommandée</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Professionnelle</span>
                    <Progress value={90} className="h-2 w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentique</span>
                    <Progress value={95} className="h-2 w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accessible</span>
                    <Progress value={70} className="h-2 w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Premium</span>
                    <Progress value={85} className="h-2 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Plan d'action recommandé
          </CardTitle>
          <CardDescription>
            Étapes prioritaires pour réussir sur le marché {countryCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(recommendations.length > 0 ? recommendations : [
              {
                title: "Adaptation produit local",
                description: "Ajuster l'étiquetage et la présentation selon les préférences locales",
                priority: "Élevé",
                timeline: "1-2 mois",
                impact: "Fort"
              },
              {
                title: "Partenariat distributeur clé",
                description: "Identifier et signer avec un importateur reconnu sur le marché",
                priority: "Élevé",
                timeline: "2-3 mois",
                impact: "Fort"
              },
              {
                title: "Campagne de lancement",
                description: "Déployer une stratégie omnicanale sur 6 mois",
                priority: "Moyen",
                timeline: "3-6 mois",
                impact: "Moyen"
              },
              {
                title: "Programme fidélisation",
                description: "Mettre en place un système de récompenses pour les clients réguliers",
                priority: "Moyen",
                timeline: "6-12 mois",
                impact: "Moyen"
              }
            ]).map((recommendation: any, index: number) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {recommendation.description}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>📅 {recommendation.timeline}</span>
                    <span>📈 Impact {recommendation.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};