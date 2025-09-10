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
  // Enhanced fields
  terroir: z.string().optional(),
  vine_age: z.number().min(0).max(200).optional().nullable(),
  yield_hl_ha: z.number().min(0).max(200).optional().nullable(),
  vinification: z.string().optional(),
  aging_details: z.string().optional(),
  bottling_info: z.string().optional(),
  ean_code: z.string().optional(),
  packaging_info: z.string().optional(),
  availability: z.string().optional(),
  producer_name: z.string().optional(),
  producer_email: z.string().optional(),
  producer_phone: z.string().optional(),
  producer_website: z.string().optional(),
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
      // Enhanced fields
      terroir: initialData?.terroir || "",
      vine_age: initialData?.vine_age || null,
      yield_hl_ha: initialData?.yield_hl_ha || null,
      vinification: initialData?.vinification || "",
      aging_details: initialData?.aging_details || "",
      bottling_info: initialData?.bottling_info || "",
      ean_code: initialData?.ean_code || "",
      packaging_info: initialData?.packaging_info || "",
      availability: initialData?.availability || "",
      producer_name: initialData?.producer_contact?.name || "",
      producer_email: initialData?.producer_contact?.email || "",
      producer_phone: initialData?.producer_contact?.phone || "",
      producer_website: initialData?.producer_contact?.website || "",
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
      // Enhanced fields
      terroir: data.terroir,
      vine_age: data.vine_age,
      yield_hl_ha: data.yield_hl_ha,
      vinification: data.vinification,
      aging_details: data.aging_details,
      bottling_info: data.bottling_info,
      ean_code: data.ean_code,
      packaging_info: data.packaging_info,
      availability: data.availability,
      producer_contact: {
        name: data.producer_name,
        email: data.producer_email,
        phone: data.producer_phone,
        website: data.producer_website,
      },
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

              {/* Enhanced Terroir & Production Section */}
              <Card className="border-muted/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    🌿 Terroir & Production
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="terroir"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terroir</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Sols argilo-calcaires, exposition sud-ouest, altitude 150m"
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vine_age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Âge moyen des vignes (années)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 25" 
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
                      name="yield_hl_ha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rendement (hl/ha)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="Ex: 45" 
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
                      name="vinification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vinification</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Fermentation en cuves inox, macération 21 jours"
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="aging_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Élevage détaillé</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Élevage 12 mois dont 6 mois en barriques neuves de chêne français"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bottling_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mise en bouteille</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Mise en bouteille mars 2021, sans collage ni filtration"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Commercial & Contact Information Section */}
              <Card className="border-muted/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    📦 Informations commerciales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ean_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code EAN</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 3760123456789"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="packaging_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conditionnement</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Cartons de 6 bouteilles, 12x75cl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disponibilité</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Disponible dès maintenant, livraison septembre 2024"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Producer Contact Section */}
              <Card className="border-muted/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    📞 Contact producteur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="producer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du contact</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Jean Dupont"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="producer_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Ex: contact@chateau.com"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="producer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: +33 1 23 45 67 89"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="producer_website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site web</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: https://www.chateau.com"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

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