import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";
import { ProductData, useCreateProduct } from "@/hooks/useProducts";

const productSchema = z.object({
  name: z.string().min(1, "Le nom du produit est requis"),
  category: z.enum(['wine', 'spirits', 'champagne', 'beer']),
  vintage: z.number().optional().nullable(),
  alcohol_percentage: z.number().min(0).max(100).optional().nullable(),
  volume_ml: z.number().min(1).optional().nullable(),
  description: z.string().optional(),
  tasting_notes: z.string().optional(),
  appellation: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: ProductData;
  extractedText?: string;
  organizationId: string;
  onSuccess?: (product?: any) => void;
  extractionQuality?: number; // Score de qualité 0-100
}

const categoryLabels = {
  wine: 'Vin',
  spirits: 'Spiritueux',
  champagne: 'Champagne',
  beer: 'Bière',
};

export const ProductForm = ({ initialData, extractedText, organizationId, onSuccess, extractionQuality }: ProductFormProps) => {
  const [awards, setAwards] = useState<string[]>(initialData?.awards || []);
  const [certifications, setCertifications] = useState<string[]>(initialData?.certifications || []);
  const [newAward, setNewAward] = useState("");
  const [newCertification, setNewCertification] = useState("");

  const createMutation = useCreateProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || 'wine',
      vintage: initialData?.vintage || null,
      alcohol_percentage: initialData?.alcohol_percentage || null,
      volume_ml: initialData?.volume_ml || null,
      description: initialData?.description || "",
      tasting_notes: initialData?.tasting_notes || "",
      appellation: initialData?.appellation || "",
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    const productData: ProductData = {
      name: data.name,
      category: data.category,
      vintage: data.vintage,
      alcohol_percentage: data.alcohol_percentage,
      volume_ml: data.volume_ml,
      description: data.description,
      tasting_notes: data.tasting_notes,
      appellation: data.appellation,
      awards,
      certifications,
      technical_specs: initialData?.technical_specs || {},
    };

    const createdProduct = await createMutation.mutateAsync({ 
      productData, 
      organizationId 
    });

    onSuccess?.(createdProduct);
  };

  const addAward = () => {
    if (newAward.trim() && !awards.includes(newAward.trim())) {
      setAwards([...awards, newAward.trim()]);
      setNewAward("");
    }
  };

  const removeAward = (award: string) => {
    setAwards(awards.filter(a => a !== award));
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const removeCertification = (certification: string) => {
    setCertifications(certifications.filter(c => c !== certification));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de qualité si les données ont été extraites */}
      {extractionQuality !== undefined && (
        <Card className={`animate-scale-in ${
          extractionQuality < 50 ? 'border-destructive/50 bg-destructive/5' : 
          extractionQuality < 80 ? 'border-warning/50 bg-warning/5' : 
          'border-success/50 bg-success/5'
        }`}>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${
                extractionQuality < 50 ? 'bg-destructive' :
                extractionQuality < 80 ? 'bg-warning' :
                'bg-success'
              }`} />
              <span className="text-sm font-medium">
                Qualité d'extraction: {extractionQuality}%
              </span>
              {extractionQuality < 50 && (
                <Badge variant="destructive" className="text-xs">
                  Vérification requise
                </Badge>
              )}
              {extractionQuality >= 50 && extractionQuality < 80 && (
                <Badge variant="secondary" className="text-xs">
                  À vérifier
                </Badge>
              )}
              {extractionQuality >= 80 && (
                <Badge variant="default" className="text-xs">
                  Bonne qualité
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Château Bordeaux Rouge 2019" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vintage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Millésime</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 2019" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alcohol_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degré d'alcool (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Ex: 13.5" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volume_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 750" 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appellation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appellation</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Bordeaux AOC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Description du produit..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tasting_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes de dégustation</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes de dégustation détaillées..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Awards Section */}
              <div className="space-y-3">
                <FormLabel>Récompenses</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une récompense"
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
                  />
                  <Button type="button" onClick={addAward} variant="outline">
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {awards.map((award) => (
                    <Badge key={award} variant="secondary" className="flex items-center gap-1">
                      {award}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeAward(award)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Certifications Section */}
              <div className="space-y-3">
                <FormLabel>Certifications</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une certification"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  />
                  <Button type="button" onClick={addCertification} variant="outline">
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert) => (
                    <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                      {cert}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeCertification(cert)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer le produit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};