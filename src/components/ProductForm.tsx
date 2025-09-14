import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductData, useCreateProduct } from "@/hooks/useProducts";

interface ProductFormProps {
  initialData?: ProductData;
  extractedText?: string;
  organizationId: string;
  onSuccess?: (product?: any) => void;
  extractionQuality?: number;
}

const categoryLabels = {
  wine: 'Vin',
  spirits: 'Spiritueux',
  champagne: 'Champagne',
  beer: 'Bière',
};

export const ProductForm = ({ 
  initialData, 
  extractedText, 
  organizationId, 
  onSuccess, 
  extractionQuality 
}: ProductFormProps) => {
  const createMutation = useCreateProduct();

  // Quality badge component
  const QualityBadge = ({ score }: { score: number }) => {
    if (score >= 85) {
      return (
        <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-md">
          🏆 V2 Premium - {score}%
        </Badge>
      );
    } else if (score >= 70) {
      return (
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
          ✨ V2 Excellent - {score}%
        </Badge>
      );
    } else if (score >= 40) {
      return (
        <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
          🚀 V2 Partiel - {score}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
          🚀 V2 Basique - {score}%
        </Badge>
      );
    }
  };

  const handleCreateProduct = async () => {
    if (!initialData) return;

    const createdProduct = await createMutation.mutateAsync({ 
      productData: initialData, 
      organizationId 
    });

    onSuccess?.(createdProduct);
  };

  if (!initialData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune donnée extraite disponible
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* V2 Quality Badge System */}
      {extractionQuality !== undefined && (
        <Card className="animate-scale-in border-gradient-subtle bg-gradient-to-r from-background to-muted/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  🚀
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">
                    Système d'extraction V2 (Optimisé)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Extraction automatique avec IA avancée
                  </div>
                </div>
              </div>
              <QualityBadge score={extractionQuality} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Text */}
      {extractedText && (
        <Card className="bg-muted/30 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Texte extrait du PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
              {extractedText}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Information Display - ChatGPT Style */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Analyse du produit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-primary">{initialData.name}</h3>
              {initialData.category && (
                <Badge variant="secondary">
                  {categoryLabels[initialData.category] || initialData.category}
                </Badge>
              )}
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {initialData.vintage && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Millésime</div>
                  <div className="font-semibold">{initialData.vintage}</div>
                </div>
              )}
              {initialData.alcohol_percentage && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Alcool</div>
                  <div className="font-semibold">{initialData.alcohol_percentage}%</div>
                </div>
              )}
              {initialData.volume_ml && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="font-semibold">{initialData.volume_ml}ml</div>
                </div>
              )}
              {initialData.appellation && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Appellation</div>
                  <div className="font-semibold text-sm">{initialData.appellation}</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {initialData.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">DESCRIPTION</h4>
              <p className="text-sm leading-relaxed">{initialData.description}</p>
            </div>
          )}

          {/* Tasting Notes */}
          {initialData.tasting_notes && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">NOTES DE DÉGUSTATION</h4>
              <p className="text-sm leading-relaxed italic">{initialData.tasting_notes}</p>
            </div>
          )}

          {/* Awards */}
          {initialData.awards && initialData.awards.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">RÉCOMPENSES</h4>
              <div className="flex flex-wrap gap-2">
                {initialData.awards.map((award, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    🏆 {award}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {initialData.certifications && initialData.certifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">CERTIFICATIONS</h4>
              <div className="flex flex-wrap gap-2">
                {initialData.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    ✓ {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Terroir Information */}
          {(initialData.terroir || initialData.vinification || initialData.aging_details) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">TERROIR & PRODUCTION</h4>
                {initialData.terroir && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Terroir</div>
                    <p className="text-sm">{initialData.terroir}</p>
                  </div>
                )}
                {initialData.vinification && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Vinification</div>
                    <p className="text-sm">{initialData.vinification}</p>
                  </div>
                )}
                {initialData.aging_details && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Élevage</div>
                    <p className="text-sm">{initialData.aging_details}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Producer Information */}
          {initialData.producer_contact?.name && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">PRODUCTEUR</h4>
                <div className="text-sm">
                  <div className="font-medium">{initialData.producer_contact.name}</div>
                  {initialData.producer_contact.email && (
                    <div className="text-muted-foreground">{initialData.producer_contact.email}</div>
                  )}
                  {initialData.producer_contact.website && (
                    <div className="text-muted-foreground">{initialData.producer_contact.website}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Create Product Button */}
          <div className="pt-4">
            <Button 
              onClick={handleCreateProduct}
              disabled={createMutation.isPending}
              className="w-full"
              size="lg"
            >
              {createMutation.isPending ? "Création en cours..." : "Créer le produit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};