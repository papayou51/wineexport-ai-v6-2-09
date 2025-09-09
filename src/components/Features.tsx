import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Globe, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  Brain,
  Download
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Intelligence Documentaire",
      description: "Analysez automatiquement vos fiches produits PDF. Notre IA extrait et structure toutes les données techniques.",
      badge: "Automatique",
      color: "wine"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Étude de Marché Export",
      description: "Taille du marché, tendances, prix moyens et analyse concurrentielle détaillée pour chaque pays cible.",
      badge: "Complet",
      color: "gold"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Analyse Réglementaire",
      description: "Douanes, taxes, étiquetage et certifications. Toutes les contraintes légales clarifiées et organisées.",
      badge: "Sécurisé",
      color: "wine"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Génération de Leads",
      description: "Obtenez une liste qualifiée d'importateurs, distributeurs et agents spécialisés dans votre segment.",
      badge: "Qualifié",
      color: "gold"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Marketing Intelligence",
      description: "Positionnement optimal, messages clés et canaux de communication adaptés à votre marché cible.",
      badge: "Stratégique",
      color: "wine"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "IA Multi-Moteurs",
      description: "ChatGPT, Claude et Gemini combinés pour une fiabilité et une qualité d'analyse maximales.",
      badge: "Innovant",
      color: "gold"
    }
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Rapidité",
      description: "Rapport complet en moins de 5 minutes"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Export",
      description: "PDF professionnel + données CSV"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Fiabilité",
      description: "3 IA croisées pour valider les résultats"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Une chaîne complète pour 
            <span className="bg-gradient-to-r from-wine-deep to-wine-medium bg-clip-text text-transparent">
              {" "}réussir à l'export
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            De l'analyse produit jusqu'aux recommandations concrètes, 
            WineExport AI vous accompagne à chaque étape de votre développement international.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${
                    feature.color === 'wine' 
                      ? 'from-wine-deep to-wine-medium text-white' 
                      : 'from-gold to-gold-light text-wine-deep'
                  }`}>
                    {feature.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-wine-deep to-wine-medium rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Pourquoi choisir WineExport AI ?</h3>
            <p className="text-white/90">L'intelligence artificielle au service de votre réussite export</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold text-lg">{benefit.title}</h4>
                <p className="text-white/80 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;