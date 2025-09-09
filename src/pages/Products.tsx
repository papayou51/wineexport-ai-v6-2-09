import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Wine, Calendar, Award, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useOrganization } from "@/hooks/useOrganization";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { QuickTooltip } from "@/components/ui/tooltip-enhanced";
import { useComponentPerformance } from "@/hooks/usePerformanceMonitoring";
import { useAccessibility } from "@/hooks/useAccessibility";

const Products = () => {
  useComponentPerformance('Products');
  const { announceToScreenReader } = useAccessibility();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { organization } = useOrganization();
  
  const { data: products = [], isLoading } = useProducts(organization?.id);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value) {
      announceToScreenReader(`Recherche en cours: ${value}`);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.appellation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryLabels = {
    wine: 'Vin',
    spirits: 'Spiritueux',
    champagne: 'Champagne',
    beer: 'Bière',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Wine className="h-8 w-8" />
            Mes Produits
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre catalogue de vins et spiritueux
          </p>
        </div>
        <QuickTooltip text="Ajouter un nouveau produit à votre catalogue" shortcut="Ctrl+N">
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </QuickTooltip>
      </div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par nom ou appellation..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            aria-label="Rechercher dans les produits"
          />
        </div>
      </div>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Wine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par ajouter votre premier produit'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/products/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un produit
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">
                        {product.name}
                      </CardTitle>
                      {product.appellation && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.appellation}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {categoryLabels[product.category as keyof typeof categoryLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {product.vintage && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {product.vintage}
                      </div>
                    )}
                    {product.alcohol_percentage && (
                      <div>{product.alcohol_percentage}% vol.</div>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {product.awards && product.awards.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {product.awards.length} récompense{product.awards.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {product.certifications && product.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.certifications.slice(0, 2).map((cert) => (
                        <Badge key={cert} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                      {product.certifications.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.certifications.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/new?product=${product.id}&focus=marketing`);
                      }}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Intelligence Marketing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
};

export default Products;