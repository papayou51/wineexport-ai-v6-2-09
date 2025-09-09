import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MarketingContentGenerator } from '@/components/MarketingContentGenerator';
import { MarketingBudgetCalculator } from '@/components/MarketingBudgetCalculator';
import { MarketingCalendar } from '@/components/marketing/MarketingCalendar';
import { CustomerPersonas } from '@/components/marketing/CustomerPersonas';
import { useProducts } from '@/hooks/useProducts';
import { Sparkles, Calculator, ArrowLeft, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const MarketingTools = () => {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('France');

  const selectedProductData = products.find(p => p.id === selectedProduct);

  const countries = [
    'France', 'Germany', 'UK', 'USA', 'Canada', 'Japan',
    'Italy', 'Spain', 'Belgium', 'Netherlands', 'Switzerland'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-wine-deep hover:bg-wine-light/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-wine-deep">Outils Marketing</h1>
            <p className="text-muted-foreground">
              Générateur de contenus et calculateur de budget pour vos campagnes marketing
            </p>
          </div>
        </div>

        {/* Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-wine-deep">Configuration</CardTitle>
            <CardDescription>
              Sélectionnez le produit et le marché cible pour personnaliser les outils
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produit</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Marché Cible</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outils Marketing */}
        {selectedProduct && selectedProductData ? (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-8">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Contenus</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendrier</span>
              </TabsTrigger>
              <TabsTrigger value="personas" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Personas</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              <MarketingContentGenerator
                productName={selectedProductData.name}
                targetCountry={selectedCountry}
              />
            </TabsContent>
            
            <TabsContent value="budget">
              <MarketingBudgetCalculator
                productName={selectedProductData.name}
                targetCountry={selectedCountry}
              />
            </TabsContent>
            
            <TabsContent value="calendar">
              <MarketingCalendar
                productName={selectedProductData.name}
                targetCountry={selectedCountry}
              />
            </TabsContent>
            
            <TabsContent value="personas">
              <CustomerPersonas
                productName={selectedProductData.name}
                targetCountry={selectedCountry}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-12 h-12 mx-auto text-wine-medium mb-4" />
              <h3 className="text-xl font-semibold text-wine-deep mb-2">
                Sélectionnez un produit pour commencer
              </h3>
              <p className="text-muted-foreground">
                Choisissez un produit et un marché cible pour accéder aux outils marketing
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarketingTools;