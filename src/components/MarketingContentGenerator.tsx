import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, FileText, Mail, MessageSquare, Presentation, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketingContentGeneratorProps {
  productName: string;
  targetCountry: string;
  className?: string;
}

interface ContentTemplate {
  type: string;
  title: string;
  icon: React.ReactNode;
  content: string;
}

export const MarketingContentGenerator: React.FC<MarketingContentGeneratorProps> = ({
  productName,
  targetCountry,
  className
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<ContentTemplate[]>([]);

  const generateContent = async () => {
    setIsGenerating(true);
    
    // Simulate AI content generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const templates: ContentTemplate[] = [
      {
        type: 'email',
        title: 'Email de Prospection',
        icon: <Mail className="w-4 h-4" />,
        content: `Objet: Découvrez ${productName} - L'excellence française arrive en ${targetCountry}

Bonjour [Nom],

Nous sommes ravis de vous présenter ${productName}, notre dernière innovation qui révolutionne le marché des vins et spiritueux.

Adapté spécifiquement aux goûts et préférences du marché ${targetCountry}, ce produit d'exception combine tradition française et innovations modernes.

Bénéfices clés pour vos clients :
• Qualité premium certifiée
• Profil gustatif adapté au marché local
• Support marketing complet inclus

Souhaitez-vous planifier une dégustation pour découvrir ${productName} ?

Cordialement,
[Votre nom]`
      },
      {
        type: 'ad',
        title: 'Message Publicitaire',
        icon: <MessageSquare className="w-4 h-4" />,
        content: `🍷 Découvrez ${productName} en ${targetCountry}

L'art de vivre français rencontre l'excellence locale.

✨ Tradition millénaire française
🌟 Adapté aux goûts ${targetCountry}
🏆 Qualité premium garantie

Commandez dès maintenant et profitez de 15% de réduction sur votre première commande !

#${productName} #VinFrançais #Qualité`
      },
      {
        type: 'description',
        title: 'Description Produit SEO',
        icon: <FileText className="w-4 h-4" />,
        content: `${productName} - Vin français d'exception pour le marché ${targetCountry}

Découvrez ${productName}, un vin français d'exception spécialement sélectionné pour les amateurs de ${targetCountry}. Notre produit combine l'héritage viticole français avec une adaptation parfaite aux préférences locales.

Caractéristiques uniques :
- Terroir français authentique
- Profil adapté au marché ${targetCountry}
- Process de vinification traditionnel
- Contrôle qualité rigoureux

Parfait pour les occasions spéciales et la gastronomie ${targetCountry}. Commandez votre ${productName} et découvrez pourquoi il devient rapidement la référence sur le marché local.

Mots-clés : vin français ${targetCountry}, ${productName}, vin premium, importation vins français`
      },
      {
        type: 'presentation',
        title: 'Script de Présentation',
        icon: <Presentation className="w-4 h-4" />,
        content: `Script de Présentation - ${productName}

[Slide 1 - Introduction]
"Bonjour et bienvenue. Aujourd'hui, je vais vous présenter ${productName}, notre innovation qui transforme le marché des vins français en ${targetCountry}."

[Slide 2 - Problématique]
"Le marché ${targetCountry} recherche l'authenticité française tout en respectant les goûts locaux. Comment concilier ces deux exigences ?"

[Slide 3 - Solution]
"${productName} répond parfaitement à ce défi. Nous avons créé un produit qui honore la tradition française tout en s'adaptant aux préférences du marché ${targetCountry}."

[Slide 4 - Bénéfices]
"Trois avantages clés :
1. Authenticité française garantie
2. Adaptation au marché local
3. Support marketing complet"

[Slide 5 - Conclusion]
"Ensemble, faisons de ${productName} la référence du marché ${targetCountry}. Êtes-vous prêt à nous rejoindre dans cette aventure ?"

Questions ?`
      }
    ];

    setGeneratedContent(templates);
    setIsGenerating(false);
    
    toast({
      title: "Contenu généré !",
      description: "4 templates marketing ont été créés avec succès.",
    });
  };

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copié !",
        description: `Le ${type} a été copié dans le presse-papier.`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le contenu.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-wine-medium" />
          Générateur de Contenus Marketing
        </CardTitle>
        <CardDescription>
          Créez des contenus marketing localisés pour {productName} en {targetCountry}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Ton de communication</Label>
            <Select value={selectedTone} onValueChange={setSelectedTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="friendly">Amical</SelectItem>
                <SelectItem value="luxury">Luxueux</SelectItem>
                <SelectItem value="casual">Décontracté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Instructions spéciales</Label>
            <Input
              placeholder="ex: Mettre l'accent sur la durabilité..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={generateContent} 
          disabled={isGenerating}
          className="w-full bg-wine-deep hover:bg-wine-medium"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer les Contenus
            </>
          )}
        </Button>

        {generatedContent.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-wine-deep">Contenus Générés</h3>
            
            <Tabs defaultValue={generatedContent[0]?.type} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                {generatedContent.map((template) => (
                  <TabsTrigger 
                    key={template.type} 
                    value={template.type}
                    className="flex items-center gap-1"
                  >
                    {template.icon}
                    <span className="hidden sm:inline">{template.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {generatedContent.map((template) => (
                <TabsContent key={template.type} value={template.type} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {template.icon}
                      <h4 className="font-semibold">{template.title}</h4>
                      <Badge variant="secondary" className="bg-wine-light/20 text-wine-deep">
                        {selectedTone}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(template.content, template.title)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([template.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${template.title}_${productName}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    value={template.content}
                    readOnly
                    className="min-h-[300px] resize-none bg-muted/30"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};