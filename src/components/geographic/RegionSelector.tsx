import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountryProfiles } from '@/hooks/useGeographicData';
import { Search, Globe, Users, TrendingUp, Filter } from 'lucide-react';

interface RegionSelectorProps {
  selectedCountries: string[];
  onCountrySelect: (countries: string[]) => void;
  maxSelections?: number;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedCountries,
  onCountrySelect,
  maxSelections = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const { data: countries = [] } = useCountryProfiles();

  const regions = Array.from(new Set(countries.map(c => c.region))).filter(Boolean);

  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         country.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || country.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleCountryToggle = (countryCode: string) => {
    const isSelected = selectedCountries.includes(countryCode);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedCountries.filter(code => code !== countryCode);
    } else {
      if (selectedCountries.length >= maxSelections) {
        return; // Max selections reached
      }
      newSelection = [...selectedCountries, countryCode];
    }

    onCountrySelect(newSelection);
  };

  const getMarketTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'mature': return 'bg-blue-100 text-blue-800';
      case 'developing': return 'bg-green-100 text-green-800';
      case 'emerging': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarketTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return '💎';
      case 'mature': return '🌟';
      case 'developing': return '📈';
      case 'emerging': return '🌱';
      default: return '🌍';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Sélection des marchés cibles
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedCountries.length} / {maxSelections} pays sélectionnés
          </p>
          <Badge variant="outline">
            {filteredCountries.length} pays disponibles
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Toutes les régions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Region Tabs */}
        <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="Europe">Europe</TabsTrigger>
            <TabsTrigger value="Americas">Amériques</TabsTrigger>
            <TabsTrigger value="Asia">Asie</TabsTrigger>
            <TabsTrigger value="Africa">Afrique</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedRegion} className="mt-4">
            {/* Country Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCountries.map(country => {
                const isSelected = selectedCountries.includes(country.code);
                const canSelect = selectedCountries.length < maxSelections || isSelected;

                return (
                  <div
                    key={country.code}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : canSelect
                        ? 'border-border hover:border-primary/50 hover:bg-muted/50'
                        : 'border-muted bg-muted/30 cursor-not-allowed opacity-50'
                      }
                    `}
                    onClick={() => canSelect && handleCountryToggle(country.code)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        disabled={!canSelect}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{country.flag_emoji}</span>
                          <span className="font-medium text-sm truncate">
                            {country.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getMarketTierColor(country.wine_market_tier)}`}
                          >
                            {getMarketTierIcon(country.wine_market_tier)} {country.wine_market_tier}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {country.subregion}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCountries.length === 0 && (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  Aucun pays trouvé
                </h3>
                <p className="text-sm text-muted-foreground">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCountrySelect([])}
              disabled={selectedCountries.length === 0}
            >
              Tout désélectionner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const topTierCountries = countries
                  .filter(c => c.wine_market_tier === 'premium' || c.wine_market_tier === 'mature')
                  .slice(0, Math.min(5, maxSelections))
                  .map(c => c.code);
                onCountrySelect(topTierCountries);
              }}
            >
              Sélection premium
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {selectedCountries.length > 0 && (
              <span>Prêt pour l'analyse géographique</span>
            )}
          </div>
        </div>

        {/* Selected Countries Summary */}
        {selectedCountries.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Pays sélectionnés:</h4>
            <div className="flex flex-wrap gap-1">
              {selectedCountries.map(countryCode => {
                const country = countries.find(c => c.code === countryCode);
                return (
                  <Badge key={countryCode} variant="secondary" className="text-xs">
                    {country?.flag_emoji} {country?.name || countryCode}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionSelector;