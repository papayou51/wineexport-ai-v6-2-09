import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { UserSession } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SessionsMapProps {
  sessions: UserSession[];
  onSessionSelect?: (session: UserSession) => void;
}

const SessionsMap: React.FC<SessionsMapProps> = ({ sessions, onSessionSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Récupérer le token Mapbox
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error || !data?.token) {
          setError('Token Mapbox non configuré');
          setLoading(false);
          return;
        }
        
        setMapboxToken(data.token);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération du token Mapbox:', err);
        setError('Erreur de configuration');
        setLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.5,
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Mettre à jour les marqueurs quand les sessions changent
  useEffect(() => {
    if (!map.current) return;

    // Supprimer les anciens marqueurs
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filtrer les sessions avec localisation et grouper par pays
    const sessionsByLocation = new Map();
    
    sessions.forEach(session => {
      if (!session.country) return;
      
      const key = `${session.country}_${session.city || 'Unknown'}`;
      if (!sessionsByLocation.has(key)) {
        sessionsByLocation.set(key, {
          sessions: [],
          country: session.country,
          city: session.city,
          // Coordonnées approximatives par pays (à améliorer avec une vraie API de géolocalisation)
          coordinates: getCountryCoordinates(session.country)
        });
      }
      
      sessionsByLocation.get(key).sessions.push(session);
    });

    // Créer les marqueurs
    sessionsByLocation.forEach((location, key) => {
      const { sessions: locationSessions, country, city, coordinates } = location;
      
      if (!coordinates) return;

      // Déterminer la couleur en fonction du niveau de risque
      const maxRiskScore = Math.max(...locationSessions.map(s => s.risk_score || 0));
      const hasCurrent = locationSessions.some(s => s.is_current);
      const hasSuspicious = locationSessions.some(s => s.is_suspicious);
      
      let color = '#10b981'; // Vert par défaut
      if (hasSuspicious || maxRiskScore > 70) {
        color = '#ef4444'; // Rouge pour suspect
      } else if (maxRiskScore > 40) {
        color = '#f59e0b'; // Orange pour moyen
      }
      
      if (hasCurrent) {
        color = '#3b82f6'; // Bleu pour session actuelle
      }

      // Créer l'élément du marqueur
      const markerElement = document.createElement('div');
      markerElement.className = 'session-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      `;

      // Badge pour le nombre de sessions
      if (locationSessions.length > 1) {
        const badge = document.createElement('div');
        badge.textContent = locationSessions.length.toString();
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #1f2937;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        `;
        markerElement.appendChild(badge);
      }

      // Créer le marqueur
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .addTo(map.current!);

      // Popup avec les détails des sessions
      const popup = new mapboxgl.Popup({
        offset: 25,
        className: 'session-popup'
      }).setHTML(`
        <div class="p-3 max-w-xs">
          <h4 class="font-semibold text-sm mb-2">${city ? `${city}, ` : ''}${country}</h4>
          <div class="space-y-2">
            ${locationSessions.map(session => `
              <div class="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div>
                  <div class="font-medium">${session.browser || 'Unknown'} • ${session.device_type || 'Unknown'}</div>
                  <div class="text-gray-500">${new Date(session.last_active).toLocaleString()}</div>
                </div>
                <div class="flex items-center gap-1">
                  ${session.is_current ? '<span class="text-blue-500 text-xs">●</span>' : ''}
                  ${session.is_suspicious ? '<span class="text-red-500 text-xs">⚠</span>' : ''}
                  ${(session.risk_score || 0) > 0 ? `<span class="text-xs text-gray-600">${session.risk_score}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `);

      marker.setPopup(popup);

      // Gestionnaire de clic
      markerElement.addEventListener('click', () => {
        if (onSessionSelect && locationSessions.length === 1) {
          onSessionSelect(locationSessions[0]);
        }
      });

      markers.current.push(marker);
    });

  }, [sessions, onSessionSelect]);

  // Fonction utilitaire pour obtenir les coordonnées par pays (basique)
  const getCountryCoordinates = (country: string): [number, number] | null => {
    const countryCoords: Record<string, [number, number]> = {
      'France': [2.3522, 48.8566],
      'United States': [-95.7129, 37.0902],
      'Germany': [10.4515, 51.1657],
      'United Kingdom': [-3.4360, 55.3781],
      'Spain': [-3.7492, 40.4637],
      'Italy': [12.5674, 41.8719],
      'Canada': [-106.3468, 56.1304],
      'Japan': [138.2529, 36.2048],
      'China': [104.1954, 35.8617],
      'Australia': [133.7751, -25.2744],
      'Brazil': [-51.9253, -14.2351],
      'India': [78.9629, 20.5937],
      'Russia': [105.3188, 61.5240],
      // Ajouter d'autres pays selon les besoins
    };
    
    return countryCoords[country] || null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Carte des Sessions
          </CardTitle>
          <CardDescription>
            Visualisation géographique de vos sessions actives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Carte des Sessions
          </CardTitle>
          <CardDescription>
            Visualisation géographique de vos sessions actives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center space-y-2">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">
                Configurez le token MAPBOX_TOKEN dans les secrets Supabase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSessions = sessions.length;
  const suspiciousSessions = sessions.filter(s => s.is_suspicious).length;
  const countries = [...new Set(sessions.map(s => s.country).filter(Boolean))].length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Carte des Sessions
        </CardTitle>
        <CardDescription>
          Visualisation géographique de vos sessions actives
        </CardDescription>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">
            {totalSessions} session{totalSessions > 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary">
            {countries} pays
          </Badge>
          {suspiciousSessions > 0 && (
            <Badge variant="destructive">
              <Shield className="h-3 w-3 mr-1" />
              {suspiciousSessions} suspecte{suspiciousSessions > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={mapContainer} className="h-96 rounded-lg overflow-hidden border" />
        
        {/* Légende */}
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Session actuelle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Sécurisée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Attention</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Suspecte</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionsMap;