import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, FileText, Brain } from "lucide-react";
import { ProductData } from "@/hooks/useProducts";

interface ExtractionDebugDialogProps {
  extractedData: ProductData;
  extractedText: string;
  metadata?: {
    totalCost?: number;
    totalLatencyMs?: number;
    runsCount?: number;
    qualityScore?: number;
    qualityIssues?: string[];
    extraction_notes?: string;
  };
}

export const ExtractionDebugDialog = ({ 
  extractedData, 
  extractedText, 
  metadata 
}: ExtractionDebugDialogProps) => {
  const [activeTab, setActiveTab] = useState<'data' | 'text'>('data');

  const calculateDataCompleteness = () => {
    const fields = [
      extractedData.name,
      extractedData.category,
      extractedData.vintage,
      extractedData.alcohol_percentage,
      extractedData.volume_ml,
      extractedData.description,
      extractedData.appellation,
    ];
    
    const filledFields = fields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;
    
    return Math.round((filledFields / fields.length) * 100);
  };

  const getFieldStatus = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <Badge variant="secondary">Vide</Badge>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? 
        <Badge variant="default">{value.length} éléments</Badge> : 
        <Badge variant="secondary">Vide</Badge>;
    }
    return <Badge variant="default">Rempli</Badge>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Voir les données extraites
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Debug de l'extraction AI
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Métriques de qualité */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Métriques de qualité</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Complétude</div>
                  <div className="font-semibold">{calculateDataCompleteness()}%</div>
                </div>
                {metadata?.qualityScore && (
                  <div>
                    <div className="text-muted-foreground">Score IA</div>
                    <div className="font-semibold">{metadata.qualityScore}%</div>
                  </div>
                )}
                {metadata?.totalLatencyMs && (
                  <div>
                    <div className="text-muted-foreground">Temps</div>
                    <div className="font-semibold">{Math.round(metadata.totalLatencyMs)}ms</div>
                  </div>
                )}
                {metadata?.runsCount && (
                  <div>
                    <div className="text-muted-foreground">Tentatives IA</div>
                    <div className="font-semibold">{metadata.runsCount}</div>
                  </div>
                )}
              </div>
              
              {/* Affichage des problèmes de qualité */}
              {metadata?.qualityIssues && metadata.qualityIssues.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Problèmes détectés :</div>
                  <div className="space-y-1">
                    {metadata.qualityIssues.map((issue, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes d'extraction */}
              {metadata?.extraction_notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Notes d'extraction :</div>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {metadata.extraction_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Onglets */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'data' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('data')}
            >
              Données extraites
            </Button>
            <Button
              variant={activeTab === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('text')}
            >
              Texte brut
            </Button>
          </div>

          {/* Contenu des onglets */}
          <ScrollArea className="h-96">
            {activeTab === 'data' ? (
              <div className="space-y-4 pr-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informations de base</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nom:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{extractedData.name || 'Non défini'}</span>
                          {getFieldStatus(extractedData.name)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Catégorie:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{extractedData.category || 'Non définie'}</span>
                          {getFieldStatus(extractedData.category)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Millésime:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{extractedData.vintage || 'Non défini'}</span>
                          {getFieldStatus(extractedData.vintage)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Alcool (%):</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{extractedData.alcohol_percentage || 'Non défini'}</span>
                          {getFieldStatus(extractedData.alcohol_percentage)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume (ml):</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{extractedData.volume_ml || 'Non défini'}</span>
                          {getFieldStatus(extractedData.volume_ml)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Appellation:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span>{extractedData.appellation || 'Non définie'}</span>
                          {getFieldStatus(extractedData.appellation)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Description et notes</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <span className="text-muted-foreground text-sm">Description:</span>
                      <div className="flex items-start gap-2 mt-1">
                        <p className="text-sm flex-1">{extractedData.description || 'Aucune description'}</p>
                        {getFieldStatus(extractedData.description)}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground text-sm">Notes de dégustation:</span>
                      <div className="flex items-start gap-2 mt-1">
                        <p className="text-sm flex-1">{extractedData.tasting_notes || 'Aucune note'}</p>
                        {getFieldStatus(extractedData.tasting_notes)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(extractedData.awards?.length > 0 || extractedData.certifications?.length > 0) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Récompenses et certifications</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div>
                        <span className="text-muted-foreground text-sm">Récompenses:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {extractedData.awards?.map((award, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {award}
                            </Badge>
                          ))}
                          {!extractedData.awards?.length && (
                            <span className="text-sm text-muted-foreground">Aucune récompense</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Certifications:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {extractedData.certifications?.map((cert, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                          {!extractedData.certifications?.length && (
                            <span className="text-sm text-muted-foreground">Aucune certification</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="pr-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Texte extrait du PDF ({extractedText.length} caractères)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-muted/30 p-3 rounded">
                    {extractedText || 'Aucun texte extrait'}
                  </pre>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};