import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Heart, DollarSign, MapPin, Clock, Smartphone, Target } from 'lucide-react';

interface CustomerPersona {
  id: string;
  name: string;
  age: string;
  income: string;
  lifestyle: string;
  avatar: string;
  description: string;
  motivations: string[];
  channels: { name: string; preference: number }[];
  purchaseBehavior: {
    frequency: string;
    budget: string;
    occasion: string[];
    influences: string[];
  };
  painPoints: string[];
  marketingTips: string[];
  country: string;
}

interface CustomerPersonasProps {
  targetCountry: string;
  productName: string;
  className?: string;
}

export const CustomerPersonas: React.FC<CustomerPersonasProps> = ({
  targetCountry,
  productName,
  className
}) => {
  const [selectedPersona, setSelectedPersona] = useState<string>('');

  // Personas by country and wine market segment
  const countryPersonas: Record<string, CustomerPersona[]> = {
    'France': [
      {
        id: 'fr-connoisseur',
        name: 'Marc - Le Connaisseur',
        age: '45-55 ans',
        income: '60-80k€/an',
        lifestyle: 'Passionné, collectionneur',
        avatar: '👨‍💼',
        description: 'Amateur éclairé qui privilégie la qualité et l\'authenticité. Collectionne les grands crus et connaît parfaitement les appellations.',
        motivations: ['Qualité exceptionnelle', 'Rareté', 'Histoire du domaine', 'Potentiel de garde'],
        channels: [
          { name: 'Cavistes spécialisés', preference: 90 },
          { name: 'Vente directe domaine', preference: 85 },
          { name: 'Salons des vins', preference: 80 },
          { name: 'Sites spécialisés', preference: 65 }
        ],
        purchaseBehavior: {
          frequency: '2-3 fois/mois',
          budget: '50-200€ par bouteille',
          occasion: ['Collection personnelle', 'Grandes occasions', 'Cadeaux VIP'],
          influences: ['Avis experts', 'Millésimes', 'Notes Robert Parker', 'Recommandations cavistes']
        },
        painPoints: ['Prix parfois prohibitifs', 'Disponibilité limitée', 'Contrefaçons'],
        marketingTips: [
          'Mettre en avant l\'histoire et le terroir',
          'Fournir des notes de dégustation détaillées',
          'Créer des événements exclusifs',
          'Proposer des visites de domaine'
        ],
        country: 'France'
      },
      {
        id: 'fr-casual',
        name: 'Sophie - La Consommatrice Occasionnelle',
        age: '30-40 ans',
        income: '35-50k€/an',
        lifestyle: 'Équilibrée, sociable',
        avatar: '👩‍💻',
        description: 'Consomme du vin lors de moments conviviaux. Recherche un bon rapport qualité-prix et des vins accessibles.',
        motivations: ['Rapport qualité-prix', 'Facilité de choix', 'Moments de partage', 'Découverte'],
        channels: [
          { name: 'Grande distribution', preference: 85 },
          { name: 'Sites e-commerce', preference: 75 },
          { name: 'Réseaux sociaux', preference: 60 },
          { name: 'Restaurants', preference: 70 }
        ],
        purchaseBehavior: {
          frequency: '1-2 fois/mois',
          budget: '10-30€ par bouteille',
          occasion: ['Repas entre amis', 'Apéritifs', 'Cadeaux simples'],
          influences: ['Prix', 'Design étiquette', 'Avis en ligne', 'Recommandations proches']
        },
        painPoints: ['Trop de choix complexes', 'Peur de mal choisir', 'Manque de conseils'],
        marketingTips: [
          'Simplifier les descriptions',
          'Créer des guides d\'accord mets-vins',
          'Utiliser les réseaux sociaux',
          'Proposer des dégustations accessibles'
        ],
        country: 'France'
      }
    ],
    'Germany': [
      {
        id: 'de-quality-seeker',
        name: 'Klaus - Der Qualitätsbewusste',
        age: '40-50 ans',
        income: '55-75k€/an',
        lifestyle: 'Méticuleux, axé qualité',
        avatar: '👨‍🔬',
        description: 'Très attentif à la qualité et aux certifications. Privilégie les vins bio et les méthodes de production durables.',
        motivations: ['Certification bio', 'Durabilité', 'Traçabilité', 'Innovation'],
        channels: [
          { name: 'Magasins bio', preference: 90 },
          { name: 'Sites spécialisés', preference: 85 },
          { name: 'Salons professionnels', preference: 75 },
          { name: 'Applications wine', preference: 70 }
        ],
        purchaseBehavior: {
          frequency: '2-4 fois/mois',
          budget: '25-60€ par bouteille',
          occasion: ['Consommation personnelle', 'Dîners formels', 'Cadeaux professionnels'],
          influences: ['Labels bio', 'Tests de qualité', 'Évaluations techniques', 'Durabilité']
        },
        painPoints: ['Manque d\'information sur les méthodes', 'Prix des vins bio', 'Disponibilité'],
        marketingTips: [
          'Mettre en avant les certifications',
          'Expliquer les méthodes de production',
          'Utiliser des données techniques',
          'Communiquer sur la durabilité'
        ],
        country: 'Germany'
      },
      {
        id: 'de-explorer',
        name: 'Anna - Die Entdeckerin',
        age: '28-35 ans',
        income: '40-55k€/an',
        lifestyle: 'Curieuse, moderne',
        avatar: '👩‍🎨',
        description: 'Jeune professionnelle qui aime découvrir de nouveaux vins. Active sur les réseaux sociaux et influencée par les tendances.',
        motivations: ['Nouveauté', 'Expérience sociale', 'Esthétique', 'Partage'],
        channels: [
          { name: 'Réseaux sociaux', preference: 90 },
          { name: 'E-commerce', preference: 85 },
          { name: 'Bars à vin', preference: 80 },
          { name: 'Applications mobiles', preference: 75 }
        ],
        purchaseBehavior: {
          frequency: '1-3 fois/mois',
          budget: '15-35€ par bouteille',
          occasion: ['Soirées', 'Découverte', 'Cadeaux tendance'],
          influences: ['Influenceurs', 'Design', 'Histoire originale', 'Expérience digitale']
        },
        painPoints: ['Manque de personnalisation', 'Complexité des descriptions', 'Livraison'],
        marketingTips: [
          'Créer du contenu visuel attractif',
          'Développer des expériences digitales',
          'Collaborer avec des influenceurs',
          'Proposer des box découverte'
        ],
        country: 'Germany'
      }
    ],
    'USA': [
      {
        id: 'us-enthusiast',
        name: 'Robert - The Wine Enthusiast',
        age: '45-60 ans',
        income: '$80-120k/year',
        lifestyle: 'Passionné, éducateur',
        avatar: '👨‍🍳',
        description: 'Amateur passionné qui organise des dégustations et collectionne les vins du monde. Très influent dans son cercle social.',
        motivations: ['Exclusivité', 'Histoire des domaines', 'Accords gastronomiques', 'Prestige'],
        channels: [
          { name: 'Wine clubs', preference: 95 },
          { name: 'Specialized retailers', preference: 90 },
          { name: 'Wine magazines', preference: 85 },
          { name: 'Winery visits', preference: 80 }
        ],
        purchaseBehavior: {
          frequency: '3-5 times/month',
          budget: '$40-150 per bottle',
          occasion: ['Personal collection', 'Hosting dinners', 'Premium gifts'],
          influences: ['Wine ratings', 'Expert reviews', 'Winemaker reputation', 'Vintage quality']
        },
        painPoints: ['High import costs', 'Limited availability', 'Storage conditions'],
        marketingTips: [
          'Emphasize French heritage and terroir',
          'Provide detailed tasting notes',
          'Create exclusive member experiences',
          'Partner with high-end restaurants'
        ],
        country: 'USA'
      },
      {
        id: 'us-millennial',
        name: 'Emma - The Millennial Explorer',
        age: '28-35 ans',
        income: '$45-70k/year',
        lifestyle: 'Sociale, tech-savvy',
        avatar: '👩‍💼',
        description: 'Jeune professionnelle qui découvre le vin à travers les expériences sociales et digitales. Sensible aux valeurs de marque.',
        motivations: ['Expérience authentique', 'Valeurs partagées', 'Innovation', 'Partage social'],
        channels: [
          { name: 'Social media', preference: 95 },
          { name: 'Online delivery', preference: 90 },
          { name: 'Wine bars', preference: 85 },
          { name: 'Mobile apps', preference: 80 }
        ],
        purchaseBehavior: {
          frequency: '1-2 times/month',
          budget: '$15-40 per bottle',
          occasion: ['Social gatherings', 'Date nights', 'Casual dining'],
          influences: ['Social media reviews', 'Sustainability', 'Brand story', 'User experience']
        },
        painPoints: ['Wine intimidation', 'Complex terminology', 'Price transparency'],
        marketingTips: [
          'Use social media storytelling',
          'Simplify wine education',
          'Highlight sustainability efforts',
          'Create interactive experiences'
        ],
        country: 'USA'
      }
    ]
  };

  const personas = countryPersonas[targetCountry] || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-wine-medium" />
          Personas Clients - {targetCountry}
        </CardTitle>
        <CardDescription>
          Profils détaillés de vos clients cibles pour {productName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {personas.length > 0 ? (
          <Tabs value={selectedPersona || personas[0].id} onValueChange={setSelectedPersona}>
            <TabsList className="grid w-full grid-cols-2">
              {personas.map((persona) => (
                <TabsTrigger key={persona.id} value={persona.id} className="flex items-center gap-2">
                  <span className="text-lg">{persona.avatar}</span>
                  <span className="hidden sm:inline">{persona.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {personas.map((persona) => (
              <TabsContent key={persona.id} value={persona.id} className="space-y-6">
                {/* Profile Overview */}
                <Card className="border-wine-light">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl">{persona.avatar}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-wine-deep">{persona.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{persona.age}</Badge>
                          <Badge variant="secondary">{persona.income}</Badge>
                          <Badge variant="secondary">{persona.lifestyle}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-3">{persona.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Motivations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="w-5 h-5 text-wine-medium" />
                        Motivations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {persona.motivations.map((motivation, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-wine-medium rounded-full" />
                            <span className="text-sm">{motivation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Canaux préférés */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Smartphone className="w-5 h-5 text-wine-medium" />
                        Canaux Préférés
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {persona.channels.map((channel, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{channel.name}</span>
                            <span>{channel.preference}%</span>
                          </div>
                          <Progress value={channel.preference} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Comportement d'achat */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="w-5 h-5 text-wine-medium" />
                        Comportement d'Achat
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Fréquence:</span>
                        <span className="text-sm ml-2">{persona.purchaseBehavior.frequency}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Budget:</span>
                        <span className="text-sm ml-2">{persona.purchaseBehavior.budget}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Occasions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {persona.purchaseBehavior.occasion.map((occasion, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {occasion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Points de friction */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="w-5 h-5 text-wine-medium" />
                        Points de Friction
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {persona.painPoints.map((pain, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm">{pain}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Conseils Marketing */}
                <Card className="bg-wine-light/10 border-wine-light">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-wine-deep" />
                      Conseils Marketing pour {productName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {persona.marketingTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-wine-medium rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun persona disponible pour {targetCountry}</p>
            <p className="text-sm">Contactez notre équipe pour des personas personnalisés</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};