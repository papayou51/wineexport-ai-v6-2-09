import React, { useState } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, LogOut, Users, AlertTriangle, Globe, BarChart3, Map } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import SessionsMap from '@/components/geographic/SessionsMap';
import SessionAnalytics from '@/components/settings/SessionAnalytics';

const getDeviceIcon = (deviceType?: string) => {
  if (!deviceType) return <Monitor className="h-4 w-4" />;
  
  switch (deviceType.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Smartphone className="h-4 w-4" />;
    case 'desktop':
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

const formatLastActive = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  } catch (error) {
    return 'Date invalide';
  }
};

export const ActiveSessions = () => {
  const { sessions, loading, terminateSession, terminateAllOtherSessions } = useSessions();
  const [selectedSession, setSelectedSession] = useState(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gérez vos sessions de connexion et sécurisez votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Statistiques pour les onglets
  const suspiciousCount = sessions.filter(s => s.is_suspicious).length;
  const countriesCount = [...new Set(sessions.map(s => s.country).filter(Boolean))].length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gérez vos sessions de connexion et sécurisez votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Liste ({sessions.length})
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Carte {countriesCount > 0 && `(${countriesCount})`}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyse {suspiciousCount > 0 && `(⚠️${suspiciousCount})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}
                    {suspiciousCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {suspiciousCount} suspecte{suspiciousCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  {sessions.filter(s => !s.is_current).length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={terminateAllOtherSessions}
                    >
                      Fermer toutes les autres
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        session.is_suspicious ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 
                        session.is_current ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getDeviceIcon(session.device_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">
                              {session.browser} • {session.device_type}
                            </p>
                            {session.is_current && (
                              <Badge variant="default" className="text-xs">
                                Session actuelle
                              </Badge>
                            )}
                            {session.is_suspicious && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Suspecte
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.city && session.country ? (
                                  <span>{session.city}, {session.country}</span>
                                ) : session.country ? (
                                  <span>{session.country}</span>
                                ) : (
                                  <span>Localisation inconnue</span>
                                )}
                              </div>
                              {session.risk_score !== undefined && session.risk_score > 0 && (
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  session.risk_score > 70 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  session.risk_score > 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  Risque: {session.risk_score}/100
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span>Dernière activité : {formatLastActive(session.last_active)}</span>
                              {session.os_details && (
                                <span>OS: {session.os_details}</span>
                              )}
                              {session.connection_type && session.connection_type !== 'direct' && (
                                <Badge variant="outline" className="text-xs">
                                  {session.connection_type === 'proxy' ? 'Proxy' : 
                                   session.connection_type === 'hosting' ? 'VPN/Hébergeur' : 
                                   session.connection_type}
                                </Badge>
                              )}
                            </div>
                            {session.ip_address && (
                              <div className="text-xs opacity-60">
                                IP: {session.ip_address}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!session.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          className="flex-shrink-0"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Sécurisez votre compte</p>
                      <p>
                        Fermez les sessions que vous ne reconnaissez pas. 
                        Si vous soupçonnez une activité suspecte, changez immédiatement votre mot de passe.
                        Les sessions suspectes sont détectées automatiquement en fonction de la localisation et d'autres facteurs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <SessionsMap 
                sessions={sessions} 
                onSessionSelect={setSelectedSession}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <SessionAnalytics sessions={sessions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};