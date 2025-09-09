import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Star, TrendingUp, AlertTriangle } from 'lucide-react';

interface MarketingEvent {
  id: string;
  title: string;
  date: string;
  type: 'seasonal' | 'trade' | 'cultural' | 'opportunity';
  importance: 'high' | 'medium' | 'low';
  description: string;
  actionSuggestion?: string;
  country: string;
}

interface MarketingCalendarProps {
  targetCountry: string;
  productName: string;
  className?: string;
}

export const MarketingCalendar: React.FC<MarketingCalendarProps> = ({
  targetCountry,
  productName,
  className
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Base marketing events by country
  const marketingEvents: Record<string, MarketingEvent[]> = {
    'France': [
      {
        id: 'fr1',
        title: 'Salon des Vins de Loire',
        date: '2024-02-15',
        type: 'trade',
        importance: 'high',
        description: 'Salon professionnel majeur pour les vins français',
        actionSuggestion: 'Réserver un stand et préparer des dégustations',
        country: 'France'
      },
      {
        id: 'fr2',
        title: 'Fête des Vendanges',
        date: '2024-09-20',
        type: 'seasonal',
        importance: 'medium',
        description: 'Période traditionnelle des vendanges, moment fort pour la communication',
        actionSuggestion: 'Lancer une campagne sur l\'authenticité et la tradition',
        country: 'France'
      },
      {
        id: 'fr3',
        title: 'Foire aux Vins (grandes surfaces)',
        date: '2024-09-01',
        type: 'opportunity',
        importance: 'high',
        description: 'Période de promotion intensive dans la grande distribution',
        actionSuggestion: 'Négocier des emplacements privilégiés et des prix attractifs',
        country: 'France'
      }
    ],
    'Germany': [
      {
        id: 'de1',
        title: 'ProWein Düsseldorf',
        date: '2024-03-17',
        type: 'trade',
        importance: 'high',
        description: 'Plus grand salon mondial des vins et spiritueux',
        actionSuggestion: 'Participation essentielle avec focus sur la qualité premium',
        country: 'Germany'
      },
      {
        id: 'de2',
        title: 'Oktoberfest',
        date: '2024-09-16',
        type: 'cultural',
        importance: 'medium',
        description: 'Festival traditionnel, opportunité pour des événements parallèles',
        actionSuggestion: 'Organiser des dégustations franco-allemandes',
        country: 'Germany'
      },
      {
        id: 'de3',
        title: 'Marché de Noël',
        date: '2024-12-01',
        type: 'seasonal',
        importance: 'high',
        description: 'Période de consommation intense, cadeaux d\'entreprise',
        actionSuggestion: 'Créer des coffrets cadeaux premium et des éditions limitées',
        country: 'Germany'
      }
    ],
    'USA': [
      {
        id: 'us1',
        title: 'Unified Wine & Grape Symposium',
        date: '2024-01-30',
        type: 'trade',
        importance: 'high',
        description: 'Symposium majeur de l\'industrie viticole américaine',
        actionSuggestion: 'Présenter les innovations françaises et nouer des partenariats',
        country: 'USA'
      },
      {
        id: 'us2',
        title: 'Thanksgiving',
        date: '2024-11-28',
        type: 'cultural',
        importance: 'high',
        description: 'Période familiale importante avec forte consommation de vin',
        actionSuggestion: 'Campagne "French Wine for American Families"',
        country: 'USA'
      },
      {
        id: 'us3',
        title: 'National French Wine Day',
        date: '2024-02-21',
        type: 'opportunity',
        importance: 'medium',
        description: 'Journée dédiée aux vins français aux États-Unis',
        actionSuggestion: 'Activation sur les réseaux sociaux et partenariats restaurants',
        country: 'USA'
      }
    ]
  };

  const countryEvents = marketingEvents[targetCountry] || [];
  
  const getFilteredEvents = () => {
    return countryEvents.filter(event => {
      const eventMonth = new Date(event.date).getMonth() + 1;
      return selectedMonth === 0 || eventMonth === selectedMonth;
    });
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'seasonal': return <Calendar className="w-4 h-4" />;
      case 'trade': return <TrendingUp className="w-4 h-4" />;
      case 'cultural': return <Star className="w-4 h-4" />;
      case 'opportunity': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-wine-medium" />
          Calendrier Marketing - {targetCountry}
        </CardTitle>
        <CardDescription>
          Événements clés et opportunités marketing pour {productName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrer par mois</label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Tous les mois</SelectItem>
                <SelectItem value="1">Janvier</SelectItem>
                <SelectItem value="2">Février</SelectItem>
                <SelectItem value="3">Mars</SelectItem>
                <SelectItem value="4">Avril</SelectItem>
                <SelectItem value="5">Mai</SelectItem>
                <SelectItem value="6">Juin</SelectItem>
                <SelectItem value="7">Juillet</SelectItem>
                <SelectItem value="8">Août</SelectItem>
                <SelectItem value="9">Septembre</SelectItem>
                <SelectItem value="10">Octobre</SelectItem>
                <SelectItem value="11">Novembre</SelectItem>
                <SelectItem value="12">Décembre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card key={event.id} className="border-l-4 border-wine-medium">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(event.type)}
                      <h3 className="font-semibold text-wine-deep">{event.title}</h3>
                      <Badge 
                        variant="secondary"
                        className={`${getImportanceColor(event.importance)} text-white`}
                      >
                        {event.importance}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.description}
                  </p>
                  
                  {event.actionSuggestion && (
                    <div className="bg-wine-light/10 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-wine-deep mb-1">
                        Action recommandée pour {productName} :
                      </h4>
                      <p className="text-sm">{event.actionSuggestion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun événement trouvé pour cette période</p>
            </div>
          )}
        </div>

        <Card className="bg-wine-light/10 border-wine-light">
          <CardContent className="p-4">
            <h4 className="font-semibold text-wine-deep mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Conseils spécifiques pour {targetCountry}
            </h4>
            <div className="space-y-2 text-sm">
              {targetCountry === 'France' && (
                <>
                  <p>• Privilégier les périodes de septembre à décembre pour les lancements</p>
                  <p>• Intégrer les traditions régionales dans la communication</p>
                  <p>• Utiliser les appellations d'origine comme argument de vente</p>
                </>
              )}
              {targetCountry === 'Germany' && (
                <>
                  <p>• Mettre l'accent sur la qualité et la certification bio</p>
                  <p>• Adapter aux préférences pour les vins blancs secs</p>
                  <p>• Participer aux salons professionnels est essentiel</p>
                </>
              )}
              {targetCountry === 'USA' && (
                <>
                  <p>• Créer des histoires autour du terroir et de l'héritage</p>
                  <p>• Adapter aux préférences pour les vins plus corsés</p>
                  <p>• Utiliser les influenceurs et sommelier endorsements</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};