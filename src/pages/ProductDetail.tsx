import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Zap, Globe, Calendar, Award, FileText, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useOrganization } from "@/hooks/useOrganization";
import { useCreateProject } from "@/hooks/useProjects";
import { MarketingIntelligenceShortcut } from "@/components/MarketingIntelligenceShortcut";
import { SmartAlert } from "@/components/SmartAlert";
import { useMarketingIntelligenceAlerts } from "@/hooks/useMarketingIntelligenceAlerts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAnalysisOption = searchParams.get('showAnalysisOption') === 'true';
  
  const { organization } = useOrganization();
  const { data: products } = useProducts(organization?.id);
  const createProject = useCreateProject();
  
  // Activer les alertes intelligentes pour ce produit
  useMarketingIntelligenceAlerts();
  
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(showAnalysisOption);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  
  const product = products?.find(p => p.id === id);

  const countries = [
    'FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE',
    'DK', 'NO', 'FI', 'PL', 'PT', 'US', 'CA', 'JP', 'AU', 'BR'
  ];

  const countryNames: Record<string, string> = {
    'FR': 'France', 'DE': 'Allemagne', 'GB': 'Royaume-Uni', 'IT': 'Italie',
    'ES': 'Espagne', 'NL': 'Pays-Bas', 'BE': 'Belgique', 'CH': 'Suisse',
    'AT': 'Autriche', 'SE': 'Suède', 'DK': 'Danemark', 'NO': 'Norvège',
    'FI': 'Finlande', 'PL': 'Pologne', 'PT': 'Portugal', 'US': 'États-Unis',
    'CA': 'Canada', 'JP': 'Japon', 'AU': 'Australie', 'BR': 'Brésil'
  };

  useEffect(() => {
    if (product && !projectName) {
      setProjectName(`Analyse complète - ${product.name}`);
    }
  }, [product, projectName]);

  const handleCountryToggle = (countryCode: string, checked: boolean) => {
    setSelectedCountries(prev => 
      checked 
        ? [...prev, countryCode]
        : prev.filter(code => code !== countryCode)
    );
  };

  const handleStartAnalysis = () => {
    if (selectedCountries.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un pays cible.",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    createProject.mutate({
      name: projectName,
      description: `Analyse complète du marché pour ${product.name}`,
      project_type: 'full_analysis',
      products: [product.id],
      target_countries: selectedCountries,
      budget_range: '5000-15000',
      timeline: '2-weeks',
    }, {
      onSuccess: (project) => {
        toast({
          title: "Projet créé",
          description: "Redirection vers l'analyse en cours...",
        });
        navigate(`/projects/${project.id}/analysis`);
      }
    });
  };

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Produit non trouvé</p>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  const categoryLabels = {
    wine: 'Vin',
    spirits: 'Spiritueux', 
    champagne: 'Champagne',
    beer: 'Bière',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alertes contextuelles */}
        <SmartAlert 
          context={{ page: 'product', productId: id }}
          className="mb-6"
        />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {categoryLabels[product.category as keyof typeof categoryLabels]}
              {product.vintage && ` • ${product.vintage}`}
              {product.appellation && ` • ${product.appellation}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/projects/new?product=${product.id}&focus=marketing`)}
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Intelligence Marketing
            </Button>
            <Button 
              onClick={() => setShowAnalysisDialog(true)}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Analyse complète
            </Button>
          </div>
        </div>

        {/* Marketing Intelligence Shortcut */}
        <MarketingIntelligenceShortcut 
          productId={product.id}
          productName={product.name}
          className="mb-6"
        />

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {product.alcohol_percentage && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Degré d'alcool</Label>
                    <p className="text-lg font-semibold">{product.alcohol_percentage}% vol.</p>
                  </div>
                )}
                {product.volume_ml && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Volume</Label>
                    <p className="text-lg font-semibold">{product.volume_ml} ml</p>
                  </div>
                )}
              </div>
              
              {product.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1">{product.description}</p>
                </div>
              )}
              
              {product.tasting_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes de dégustation</Label>
                  <p className="mt-1">{product.tasting_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Awards */}
            {product.awards && product.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Récompenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.awards.map((award, index) => (
                      <Badge key={index} variant="secondary" className="w-full justify-start">
                        {award}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {product.certifications && product.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="w-full justify-start">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Analysis Dialog */}
        <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Lancer l'analyse complète
              </DialogTitle>
              <DialogDescription>
                Créez un projet d'analyse complète incluant étude de marché, analyse réglementaire, 
                génération de leads et intelligence marketing pour ce produit.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="project-name">Nom du projet</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Nom du projet d'analyse"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Pays cibles</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Sélectionnez les pays que vous souhaitez analyser
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {countries.map((countryCode) => (
                    <div key={countryCode} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-${countryCode}`}
                        checked={selectedCountries.includes(countryCode)}
                        onCheckedChange={(checked) => 
                          handleCountryToggle(countryCode, checked as boolean)
                        }
                      />
                      <Label htmlFor={`country-${countryCode}`} className="text-sm">
                        {countryNames[countryCode] || countryCode}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleStartAnalysis}
                  disabled={createProject.isPending || selectedCountries.length === 0}
                >
                  {createProject.isPending ? 'Création...' : 'Démarrer l\'analyse'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductDetail;