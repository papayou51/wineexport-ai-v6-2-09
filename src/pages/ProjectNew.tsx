import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateProject, CreateProjectData } from '@/hooks/useProjects';
import { useProducts } from '@/hooks/useProducts';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, BarChart3, FileText, Users, Target, Globe, Zap } from 'lucide-react';

const ProjectNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organization } = useOrganization();
  const { data: products } = useProducts(organization?.id);
  const createProject = useCreateProject();

  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    project_type: 'market_study',
    products: [],
    target_countries: [],
    budget_range: '',
    timeline: '',
  });

  // Set project type from URL parameter
  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence', 'full_analysis'].includes(type)) {
      setFormData(prev => ({ ...prev, project_type: type as any }));
    }
  }, [searchParams]);

  const projectTypes = [
    {
      value: 'market_study',
      label: 'Étude de Marché',
      description: 'Analyser la taille du marché, la concurrence et les tendances',
      icon: BarChart3,
      color: 'text-blue-600'
    },
    {
      value: 'regulatory_analysis',
      label: 'Analyse Réglementaire',
      description: 'Vérifier les contraintes légales, taxes et certifications',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      value: 'lead_generation',
      label: 'Génération de Leads',
      description: 'Identifier des importateurs et distributeurs qualifiés',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      value: 'marketing_intelligence',
      label: 'Marketing Intelligence',
      description: 'Développer une stratégie marketing et de positionnement',
      icon: Target,
      color: 'text-orange-600'
    },
    {
      value: 'full_analysis',
      label: 'Analyse Complète',
      description: 'Analyse multi-facettes incluant tous les aspects',
      icon: Zap,
      color: 'text-red-600'
    }
  ];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    createProject.mutate(formData, {
      onSuccess: (project) => {
        navigate(`/projects/${project.id}`);
      }
    });
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      products: checked 
        ? [...(prev.products || []), productId]
        : (prev.products || []).filter(id => id !== productId)
    }));
  };

  const handleCountryToggle = (countryCode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      target_countries: checked 
        ? [...(prev.target_countries || []), countryCode]
        : (prev.target_countries || []).filter(code => code !== countryCode)
    }));
  };

  const selectedProjectType = projectTypes.find(type => type.value === formData.project_type);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nouveau Projet</h1>
            <p className="text-muted-foreground">
              Créez un nouveau projet d'analyse export
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Type d'Analyse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.project_type === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, project_type: type.value as any }))}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${type.color}`} />
                        <div className="flex-1">
                          <h3 className="font-medium">{type.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du projet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Export Bordeaux vers l'Allemagne"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez les objectifs de votre projet d'export"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget estimé</Label>
                  <Select
                    value={formData.budget_range || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-5000">0 - 5 000 €</SelectItem>
                      <SelectItem value="5000-15000">5 000 - 15 000 €</SelectItem>
                      <SelectItem value="15000-50000">15 000 - 50 000 €</SelectItem>
                      <SelectItem value="50000+">50 000 € +</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Délai souhaité</Label>
                  <Select
                    value={formData.timeline || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un délai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-week">1 semaine</SelectItem>
                      <SelectItem value="2-weeks">2 semaines</SelectItem>
                      <SelectItem value="1-month">1 mois</SelectItem>
                      <SelectItem value="3-months">3 mois</SelectItem>
                      <SelectItem value="6-months">6 mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Produits à Analyser</CardTitle>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={(formData.products || []).includes(product.id)}
                        onCheckedChange={(checked) => 
                          handleProductToggle(product.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`product-${product.id}`} className="flex-1">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.category} - {product.vintage || 'NV'}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Aucun produit disponible. Ajoutez d'abord des produits pour les analyser.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/products/new">Ajouter un produit</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Country Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Pays Cibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {countries.map((countryCode) => (
                  <div key={countryCode} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${countryCode}`}
                      checked={(formData.target_countries || []).includes(countryCode)}
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
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/projects')}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createProject.isPending}
            >
              {createProject.isPending ? 'Création...' : 'Créer le Projet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectNew;