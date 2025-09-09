import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Target, 
  BarChart3, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

interface MarketingIntelligenceShortcutProps {
  productId: string;
  productName: string;
  className?: string;
}

export const MarketingIntelligenceShortcut = ({ 
  productId, 
  productName, 
  className 
}: MarketingIntelligenceShortcutProps) => {
  
  const marketingFeatures = [
    {
      icon: Target,
      title: "Positionnement",
      description: "Stratégie de marque adaptée au marché local"
    },
    {
      icon: BarChart3,
      title: "Canaux Marketing",
      description: "Canaux recommandés pour votre audience cible"
    },
    {
      icon: TrendingUp,
      title: "Plan d'Action",
      description: "Roadmap priorisée pour le lancement"
    }
  ];

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Intelligence Marketing</CardTitle>
            <p className="text-sm text-muted-foreground">
              Analysez les opportunités marketing pour {productName}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {marketingFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-md mt-1">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <Link to={`/projects/new?product=${productId}&focus=marketing`}>
            <Button className="w-full" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Démarrer l'analyse marketing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-xs">
            Analyse IA • Insights personnalisés
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};