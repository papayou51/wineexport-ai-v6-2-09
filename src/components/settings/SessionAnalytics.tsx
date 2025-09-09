import React from 'react';
import { UserSession } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Globe, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Smartphone,
  Monitor,
  MapPin,
  Wifi
} from 'lucide-react';

interface SessionAnalyticsProps {
  sessions: UserSession[];
}

const SessionAnalytics: React.FC<SessionAnalyticsProps> = ({ sessions }) => {
  // Calculs des statistiques
  const totalSessions = sessions.length;
  const suspiciousSessions = sessions.filter(s => s.is_suspicious).length;
  const averageRiskScore = sessions.reduce((sum, s) => sum + (s.risk_score || 0), 0) / totalSessions || 0;
  
  // Sessions par pays
  const countryStats = sessions.reduce((acc, session) => {
    if (!session.country) return acc;
    acc[session.country] = (acc[session.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Sessions par appareil
  const deviceStats = sessions.reduce((acc, session) => {
    const device = session.device_type || 'Unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sessions par navigateur
  const browserStats = sessions.reduce((acc, session) => {
    const browser = session.browser || 'Unknown';
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Types de connexion
  const connectionStats = sessions.reduce((acc, session) => {
    const type = session.connection_type || 'direct';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sessions récentes (dernières 24h)
  const recentSessions = sessions.filter(s => 
    new Date(s.last_active).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length;

  // Niveau de risque global
  const getRiskLevel = (score: number) => {
    if (score < 25) return { level: 'Faible', color: 'text-green-600', bg: 'bg-green-100' };
    if (score < 50) return { level: 'Modéré', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score < 75) return { level: 'Élevé', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Critique', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const riskInfo = getRiskLevel(averageRiskScore);

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions totales</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernières 24h</p>
                <p className="text-2xl font-bold">{recentSessions}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pays uniques</p>
                <p className="text-2xl font-bold">{Object.keys(countryStats).length}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions suspectes</p>
                <p className="text-2xl font-bold text-red-600">{suspiciousSessions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score de risque global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Score de Sécurité Global
          </CardTitle>
          <CardDescription>
            Évaluation du niveau de risque moyen de vos sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-3xl font-bold">{Math.round(averageRiskScore)}/100</p>
              </div>
              <Badge className={`${riskInfo.bg} ${riskInfo.color} border-current`}>
                {riskInfo.level}
              </Badge>
            </div>
            <Progress value={averageRiskScore} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {suspiciousSessions > 0 
                ? `${suspiciousSessions} session${suspiciousSessions > 1 ? 's' : ''} nécessite${suspiciousSessions === 1 ? '' : 'nt'} votre attention`
                : 'Toutes vos sessions semblent sécurisées'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pays les plus fréquents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / totalSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
              {topCountries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune donnée de géolocalisation disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Répartition des appareils */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Types d'appareils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(deviceStats).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {device === 'Mobile' ? (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / totalSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Navigateurs utilisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(browserStats).map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{browser}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / totalSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Types de connexion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Types de connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(connectionStats).map(([type, count]) => {
                let icon;
                let label;
                let color = 'text-green-600';
                
                switch (type) {
                  case 'direct':
                    icon = <Wifi className="h-4 w-4 text-green-600" />;
                    label = 'Connexion directe';
                    break;
                  case 'proxy':
                    icon = <Shield className="h-4 w-4 text-yellow-600" />;
                    label = 'Proxy';
                    color = 'text-yellow-600';
                    break;
                  case 'hosting':
                    icon = <AlertTriangle className="h-4 w-4 text-red-600" />;
                    label = 'Hébergeur/VPN';
                    color = 'text-red-600';
                    break;
                  default:
                    icon = <Wifi className="h-4 w-4 text-gray-600" />;
                    label = type;
                    color = 'text-gray-600';
                }
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className={`text-sm font-medium ${color}`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / totalSessions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionAnalytics;