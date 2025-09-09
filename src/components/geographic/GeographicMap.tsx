import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Target, Globe, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface GeographicData {
  country: string;
  countryCode: string;
  marketScore: number;
  population: number;
  gdpPerCapita: number;
  wineConsumption: number;
  regulations: 'low' | 'medium' | 'high';
  coordinates: [number, number];
}

interface GeographicMapProps {
  selectedCountries?: string[];
  onCountrySelect?: (country: string) => void;
  data?: GeographicData[];
  className?: string;
}

// Sample geographic data (in production this would come from APIs)
const SAMPLE_GEOGRAPHIC_DATA: GeographicData[] = [
  {
    country: 'France',
    countryCode: 'FR',
    marketScore: 85,
    population: 67000000,
    gdpPerCapita: 42500,
    wineConsumption: 40.2,
    regulations: 'medium',
    coordinates: [2.3522, 46.6030]
  },
  {
    country: 'Germany', 
    countryCode: 'DE',
    marketScore: 78,
    population: 83000000,
    gdpPerCapita: 46200,
    wineConsumption: 20.1,
    regulations: 'high',
    coordinates: [10.4515, 51.1657]
  },
  {
    country: 'United States',
    countryCode: 'US', 
    marketScore: 82,
    population: 331000000,
    gdpPerCapita: 62800,
    wineConsumption: 12.4,
    regulations: 'medium',
    coordinates: [-95.7129, 37.0902]
  },
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    marketScore: 75,
    population: 67000000,
    gdpPerCapita: 42300,
    wineConsumption: 22.9,
    regulations: 'low',
    coordinates: [-3.4360, 55.3781]
  },
  {
    country: 'Japan',
    countryCode: 'JP',
    marketScore: 70,
    population: 125000000,
    gdpPerCapita: 39300,
    wineConsumption: 2.7,
    regulations: 'high',
    coordinates: [138.2529, 36.2048]
  }
];

const GeographicMap: React.FC<GeographicMapProps> = ({
  selectedCountries = [],
  onCountrySelect,
  data = SAMPLE_GEOGRAPHIC_DATA,
  className = ""
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredCountry, setHoveredCountry] = useState<GeographicData | null>(null);
  const [manualToken, setManualToken] = useState<string>('');
  const { toast } = useToast();

  // Fetch Mapbox token from Supabase Edge Function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setTokenStatus('loading');
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error || !data?.token) {
          console.log('Token not configured in Supabase, switching to manual input');
          setTokenStatus('manual');
          return;
        }
        
        setMapboxToken(data.token);
        setTokenStatus('success');
        
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setTokenStatus('manual');
      }
    };

    fetchMapboxToken();
  }, []);

  // Handle manual token submission
  const handleManualToken = () => {
    if (manualToken.trim()) {
      setMapboxToken(manualToken.trim());
      setTokenStatus('success');
      // Store in localStorage for future use
      localStorage.setItem('mapbox_token', manualToken.trim());
      toast({
        title: "Token configuré",
        description: "Token Mapbox configuré avec succès"
      });
    }
  };

  // Load token from localStorage if available
  useEffect(() => {
    if (tokenStatus === 'manual' && !mapboxToken) {
      const savedToken = localStorage.getItem('mapbox_token');
      if (savedToken) {
        setManualToken(savedToken);
      }
    }
  }, [tokenStatus]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || tokenStatus !== 'success') return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'mercator',
      zoom: 2,
      center: [0, 20],
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add markers for each country
    data.forEach((country) => {
      const el = document.createElement('div');
      el.className = 'geographic-marker';
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${getMarkerColor(country.marketScore)};
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        transition: transform 0.2s;
      `;
      
      el.textContent = country.marketScore.toString();
      
      // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        setHoveredCountry(country);
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        setHoveredCountry(null);
      });
      
      // Add click handler
      el.addEventListener('click', () => {
        onCountrySelect?.(country.countryCode);
        toast({
          title: `${country.country} sélectionné`,
          description: `Score de marché: ${country.marketScore}/100`
        });
      });

      new mapboxgl.Marker(el)
        .setLngLat(country.coordinates)
        .addTo(map.current!);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, data, onCountrySelect, tokenStatus]);

  const getMarkerColor = (score: number): string => {
    if (score >= 80) return 'hsl(var(--primary))';
    if (score >= 65) return 'hsl(var(--accent))';
    if (score >= 50) return 'hsl(var(--wine-medium))';
    return 'hsl(var(--muted-foreground))';
  };

  const getRegulationColor = (regulations: string): string => {
    switch (regulations) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredData = data.filter(country =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mapbox Token Configuration */}
      {tokenStatus === 'manual' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <span>
              Pour afficher les cartes interactives, vous devez configurer votre token Mapbox public.
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="Votre token Mapbox public..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualToken()}
                className="flex-1"
              />
              <Button 
                onClick={handleManualToken}
                disabled={!manualToken.trim()}
                size="sm"
              >
                Configurer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Obtenir token
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {tokenStatus === 'loading' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chargement de la configuration Mapbox...
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Intelligence Géographique
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Excellent (80+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <span>Bon (65-79)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-wine-medium"></div>
              <span>Moyen (50-64)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
              <span>Faible (&lt;50)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {tokenStatus === 'success' ? (
                <div 
                  ref={mapContainer} 
                  className="w-full h-96 rounded-lg"
                  style={{ minHeight: '400px' }}
                />
              ) : (
                <div className="w-full h-96 rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      {tokenStatus === 'loading' 
                        ? 'Chargement de la carte...' 
                        : 'Configurez votre token Mapbox pour afficher la carte interactive'
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Country Details */}
        <div className="space-y-4">
          {hoveredCountry && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {hoveredCountry.country}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Score de marché</span>
                    <Badge variant="outline" className="font-mono">
                      {hoveredCountry.marketScore}/100
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Population</span>
                    <span className="text-sm font-medium">
                      {(hoveredCountry.population / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">PIB/habitant</span>
                    <span className="text-sm font-medium">
                      ${hoveredCountry.gdpPerCapita.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consommation vin</span>
                    <span className="text-sm font-medium">
                      {hoveredCountry.wineConsumption}L/an
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Réglementation</span>
                    <Badge className={getRegulationColor(hoveredCountry.regulations)}>
                      {hoveredCountry.regulations}
                    </Badge>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => onCountrySelect?.(hoveredCountry.countryCode)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Sélectionner
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Countries List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Marchés disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredData.slice(0, 5).map((country) => (
                  <div
                    key={country.countryCode}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => onCountrySelect?.(country.countryCode)}
                  >
                    <div>
                      <span className="font-medium">{country.country}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {country.marketScore}
                        </Badge>
                      </div>
                    </div>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeographicMap;