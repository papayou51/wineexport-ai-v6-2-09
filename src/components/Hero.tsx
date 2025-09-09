import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, Search, FileText, TrendingUp } from "lucide-react";
import heroImage from "@/assets/wine-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Premium wine cellar showcasing elegant bottles"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-wine-deep/90 via-wine-medium/80 to-wine-deep/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              WineExport
              <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
                {" "}AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light max-w-3xl mx-auto">
              L'assistant intelligent qui transforme vos vins en succès international. 
              Analysez, prospectez et exportez en toute confiance.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              <Globe className="mr-2" />
              Commencer l'analyse
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10">
              <FileText className="mr-2" />
              Voir la démo
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-16">
            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-wine-medium to-wine-deep rounded-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Je sais où exporter
                  </h3>
                  <p className="text-white/80">
                    Obtenez une étude de marché complète, l'analyse réglementaire et des leads qualifiés pour votre pays cible.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-gold to-gold-light rounded-lg">
                  <TrendingUp className="h-6 w-6 text-wine-deep" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Je cherche des opportunités
                  </h3>
                  <p className="text-white/80">
                    Découvrez les 5 marchés les plus porteurs pour vos produits grâce à notre analyse de 195 pays.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-gold">195</div>
              <div className="text-white/70">Pays analysés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold">3</div>
              <div className="text-white/70">IA combinées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gold">&lt; 5min</div>
              <div className="text-white/70">Rapport complet</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;