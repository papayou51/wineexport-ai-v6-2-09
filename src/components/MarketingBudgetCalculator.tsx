import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, Target, DollarSign, PieChart, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketingBudgetCalculatorProps {
  productName: string;
  targetCountry: string;
  className?: string;
}

interface ChannelBudget {
  name: string;
  percentage: number;
  cost: number;
  roi: number;
  description: string;
}

interface BudgetScenario {
  name: string;
  totalBudget: number;
  timeframe: number; // months
  channels: ChannelBudget[];
  expectedROI: number;
  confidence: number;
}

export const MarketingBudgetCalculator: React.FC<MarketingBudgetCalculatorProps> = ({
  productName,
  targetCountry,
  className
}) => {
  const { toast } = useToast();
  const [totalBudget, setTotalBudget] = useState(50000);
  const [timeframe, setTimeframe] = useState(12);
  const [marketingGoal, setMarketingGoal] = useState('awareness');
  const [channels, setChannels] = useState({
    digital: 40,
    traditional: 25,
    events: 20,
    pr: 10,
    content: 5
  });

  // Base costs per channel (as percentages and ROI multipliers by country)
  const channelData = {
    digital: { name: 'Marketing Digital', roi: 3.2, description: 'SEO, SEM, Social Media, Display' },
    traditional: { name: 'Médias Traditionnels', roi: 2.1, description: 'TV, Radio, Print, Outdoor' },
    events: { name: 'Événements & Salons', roi: 2.8, description: 'Salons, Dégustations, B2B Events' },
    pr: { name: 'Relations Publiques', roi: 4.5, description: 'RP, Influence, Presse spécialisée' },
    content: { name: 'Contenu & Formation', roi: 3.8, description: 'Vidéos, Guides, Formation équipes' }
  };

  const countryMultipliers: Record<string, { cost: number; competition: number }> = {
    'France': { cost: 1.0, competition: 1.0 },
    'Germany': { cost: 1.15, competition: 1.2 },
    'UK': { cost: 1.25, competition: 1.3 },
    'USA': { cost: 1.4, competition: 1.5 },
    'Japan': { cost: 1.3, competition: 1.1 },
    'Canada': { cost: 1.1, competition: 1.0 }
  };

  const multiplier = countryMultipliers[targetCountry] || { cost: 1.0, competition: 1.0 };

  const calculatedBudget = useMemo(() => {
    const monthlyBudget = totalBudget / timeframe;
    const channelBudgets: ChannelBudget[] = Object.entries(channels).map(([key, percentage]) => {
      const channelInfo = channelData[key as keyof typeof channelData];
      const cost = (totalBudget * percentage) / 100;
      const adjustedROI = channelInfo.roi / multiplier.competition;
      
      return {
        name: channelInfo.name,
        percentage,
        cost,
        roi: adjustedROI,
        description: channelInfo.description
      };
    });

    const totalROI = channelBudgets.reduce((acc, channel) => {
      return acc + (channel.cost * channel.roi);
    }, 0);

    const confidence = Math.min(95, Math.max(60, 85 - (multiplier.competition * 10)));

    return {
      channels: channelBudgets,
      monthlyBudget,
      totalROI,
      netROI: totalROI - totalBudget,
      roiPercentage: ((totalROI - totalBudget) / totalBudget) * 100,
      confidence
    };
  }, [totalBudget, timeframe, channels, multiplier]);

  const updateChannelPercentage = (channel: string, value: number) => {
    const totalOthers = Object.entries(channels)
      .filter(([key]) => key !== channel)
      .reduce((sum, [, percent]) => sum + percent, 0);
    
    if (totalOthers + value <= 100) {
      setChannels(prev => ({ ...prev, [channel]: value }));
    }
  };

  const generateScenarios = () => {
    const scenarios: BudgetScenario[] = [
      {
        name: 'Conservateur',
        totalBudget: totalBudget * 0.7,
        timeframe: timeframe,
        channels: calculatedBudget.channels.map(c => ({ 
          ...c, 
          cost: c.cost * 0.7,
          roi: c.roi * 0.9 
        })),
        expectedROI: calculatedBudget.roiPercentage * 0.8,
        confidence: calculatedBudget.confidence + 5
      },
      {
        name: 'Optimisé',
        totalBudget: totalBudget,
        timeframe: timeframe,
        channels: calculatedBudget.channels,
        expectedROI: calculatedBudget.roiPercentage,
        confidence: calculatedBudget.confidence
      },
      {
        name: 'Agressif',
        totalBudget: totalBudget * 1.5,
        timeframe: timeframe,
        channels: calculatedBudget.channels.map(c => ({ 
          ...c, 
          cost: c.cost * 1.5,
          roi: c.roi * 1.1 
        })),
        expectedROI: calculatedBudget.roiPercentage * 1.3,
        confidence: calculatedBudget.confidence - 10
      }
    ];

    toast({
      title: "Scénarios générés !",
      description: "3 scénarios de budget ont été calculés selon votre contexte.",
    });

    return scenarios;
  };

  const exportBudget = () => {
    const exportData = {
      produit: productName,
      pays: targetCountry,
      budget_total: totalBudget,
      duree_mois: timeframe,
      budget_mensuel: calculatedBudget.monthlyBudget,
      canaux: calculatedBudget.channels,
      roi_attendu: calculatedBudget.roiPercentage,
      confiance: calculatedBudget.confidence,
      date_generation: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_marketing_${productName}_${targetCountry}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Budget exporté !",
      description: "Le fichier de budget a été téléchargé.",
    });
  };

  const totalPercentage = Object.values(channels).reduce((sum, val) => sum + val, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-wine-medium" />
          Calculateur de Budget Marketing
        </CardTitle>
        <CardDescription>
          Optimisez votre budget marketing pour {productName} en {targetCountry}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration du budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Budget Total (€)</Label>
            <Input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              min="1000"
              step="1000"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Durée (mois)</Label>
            <Input
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              min="3"
              max="36"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Pays Cible</Label>
            <Input value={targetCountry} readOnly className="bg-muted" />
          </div>
        </div>

        {/* Répartition par canaux */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-wine-deep">Répartition par Canaux</h3>
            <Badge 
              variant={totalPercentage === 100 ? "default" : "destructive"}
              className={totalPercentage === 100 ? "bg-wine-medium" : ""}
            >
              {totalPercentage}%
            </Badge>
          </div>
          
          <div className="space-y-4">
            {Object.entries(channels).map(([key, percentage]) => {
              const channelInfo = channelData[key as keyof typeof channelData];
              const cost = (totalBudget * percentage) / 100;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {channelInfo.name}
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {percentage}% • €{cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[percentage]}
                    onValueChange={(value) => updateChannelPercentage(key, value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {channelInfo.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Résultats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-wine-medium" />
                <div>
                  <p className="text-sm font-medium">Budget Mensuel</p>
                  <p className="text-2xl font-bold text-wine-deep">
                    €{calculatedBudget.monthlyBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-wine-medium" />
                <div>
                  <p className="text-sm font-medium">ROI Attendu</p>
                  <p className="text-2xl font-bold text-wine-deep">
                    {calculatedBudget.roiPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-wine-medium" />
                <div>
                  <p className="text-sm font-medium">Retour Net</p>
                  <p className="text-2xl font-bold text-wine-deep">
                    €{calculatedBudget.netROI.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-wine-medium" />
                <div>
                  <p className="text-sm font-medium">Confiance</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-wine-deep">
                      {calculatedBudget.confidence}%
                    </p>
                    <Progress value={calculatedBudget.confidence} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={generateScenarios}
            variant="outline"
            className="border-wine-medium text-wine-deep hover:bg-wine-light/20"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Générer Scénarios
          </Button>
          
          <Button 
            onClick={exportBudget}
            variant="outline"
            className="border-wine-medium text-wine-deep hover:bg-wine-light/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter Budget
          </Button>
        </div>

        {/* Conseils contextuels */}
        <Card className="bg-wine-light/10 border-wine-light">
          <CardContent className="p-4">
            <h4 className="font-semibold text-wine-deep mb-2">
              Conseils pour {targetCountry}
            </h4>
            <div className="space-y-1 text-sm">
              <p>• Coût médias {((multiplier.cost - 1) * 100).toFixed(0)}% {multiplier.cost > 1 ? 'plus élevé' : 'plus bas'} qu'en France</p>
              <p>• Concurrence {((multiplier.competition - 1) * 100).toFixed(0)}% {multiplier.competition > 1 ? 'plus intense' : 'plus faible'}</p>
              <p>• ROI ajusté selon les spécificités du marché local</p>
              <p>• Budget mensuel recommandé : €{(calculatedBudget.monthlyBudget * 0.8).toLocaleString()} - €{(calculatedBudget.monthlyBudget * 1.2).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};