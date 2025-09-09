import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Eye, CheckCircle, X, Globe, Monitor, Clock } from 'lucide-react';
import { useSecurityIncidents } from '@/hooks/useSecurityIncidents';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  country?: string;
  city?: string;
  device_info?: any;
  details: any;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
    case 'medium':
      return <Eye className="h-4 w-4" />;
    case 'low':
      return <Shield className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'destructive';
    case 'investigating': return 'secondary';
    case 'resolved': return 'default';
    case 'false_positive': return 'outline';
    default: return 'outline';
  }
};

const getIncidentTypeLabel = (type: string) => {
  switch (type) {
    case 'geographic_violation': return 'Violation géographique';
    case 'threat_intelligence': return 'Menace détectée';
    case 'attack_pattern': return 'Pattern d\'attaque';
    case 'high_risk_login': return 'Connexion à risque';
    case 'brute_force': return 'Force brute';
    case 'suspicious_activity': return 'Activité suspecte';
    default: return type;
  }
};

export const SecurityIncidentsTab = () => {
  const { incidents, loading, updateIncident } = useSecurityIncidents();
  const { toast } = useToast();
  
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const handleUpdateStatus = async (incidentId: string, status: 'open' | 'investigating' | 'resolved' | 'false_positive') => {
    try {
      await updateIncident(incidentId, { status });
      toast({
        title: "Succès",
        description: "Statut de l'incident mis à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'incident",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filtrer les incidents
  let filteredIncidents = incidents;
  if (selectedSeverity !== 'all') {
    filteredIncidents = filteredIncidents.filter(i => i.severity === selectedSeverity);
  }
  if (selectedStatus !== 'all') {
    filteredIncidents = filteredIncidents.filter(i => i.status === selectedStatus);
  }

  const openIncidents = incidents.filter(i => i.status === 'open');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const recentIncidents = incidents.filter(i => 
    new Date(i.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incidents de sécurité
          </CardTitle>
          <CardDescription>
            Surveillez et gérez les incidents de sécurité détectés automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="incidents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="incidents" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Incidents ({filteredIncidents.length})
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incidents" className="mt-6 space-y-6">
              {/* Filtres */}
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sévérité:</label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Statut:</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="investigating">En cours</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="false_positive">Faux positif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Liste des incidents */}
              {filteredIncidents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {incidents.length === 0 ? 'Aucun incident détecté' : 'Aucun incident correspondant'}
                    </h3>
                    <p className="text-muted-foreground">
                      {incidents.length === 0 
                        ? "C'est une bonne nouvelle ! Aucune activité suspecte n'a été détectée."
                        : 'Modifiez les filtres pour voir d\'autres incidents.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredIncidents
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((incident) => (
                    <Card 
                      key={incident.id}
                      className={`transition-all ${
                        incident.severity === 'critical' 
                          ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                          : incident.status === 'open'
                          ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
                          : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getSeverityIcon(incident.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-medium">
                                  {getIncidentTypeLabel(incident.incident_type)}
                                </h4>
                                <Badge variant={getSeverityColor(incident.severity)}>
                                  {incident.severity.toUpperCase()}
                                </Badge>
                                <Badge variant={getStatusColor(incident.status)}>
                                  {incident.status === 'open' ? 'Ouvert' :
                                   incident.status === 'investigating' ? 'En cours' :
                                   incident.status === 'resolved' ? 'Résolu' :
                                   'Faux positif'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {formatDistanceToNow(new Date(incident.created_at), { 
                                        addSuffix: true, 
                                        locale: fr 
                                      })}
                                    </span>
                                  </div>
                                  {incident.source_ip && (
                                    <span>IP: {incident.source_ip}</span>
                                  )}
                                  {incident.country && (
                                    <div className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      <span>
                                        {incident.city ? `${incident.city}, ${incident.country}` : incident.country}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {incident.device_info && (
                                  <div className="flex items-center gap-1">
                                    <Monitor className="h-3 w-3" />
                                    <span>{incident.device_info.user_agent || 'Appareil inconnu'}</span>
                                  </div>
                                )}
                                
                                {incident.details && (
                                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                    {typeof incident.details === 'object' ? (
                                      <div className="space-y-1">
                                        {incident.details.reason && (
                                          <div><strong>Raison:</strong> {incident.details.reason}</div>
                                        )}
                                        {incident.details.patterns && (
                                          <div><strong>Patterns:</strong> {incident.details.patterns.join(', ')}</div>
                                        )}
                                        {incident.details.risk_score && (
                                          <div><strong>Score de risque:</strong> {incident.details.risk_score}/100</div>
                                        )}
                                        {incident.details.reasons && Array.isArray(incident.details.reasons) && (
                                          <div><strong>Détails:</strong> {incident.details.reasons.join(', ')}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <span>{incident.details}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {incident.status === 'open' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(incident.id, 'investigating')}
                                >
                                  Enquêter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(incident.id, 'resolved')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(incident.id, 'false_positive')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Incidents ouverts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{openIncidents.length}</div>
                    <p className="text-sm text-muted-foreground">
                      Nécessitent votre attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Incidents critiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{criticalIncidents.length}</div>
                    <p className="text-sm text-muted-foreground">
                      Sévérité critique
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dernières 24h</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{recentIncidents.length}</div>
                    <p className="text-sm text-muted-foreground">
                      Incidents récents
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Répartition par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      incidents.reduce((acc, incident) => {
                        acc[incident.incident_type] = (acc[incident.incident_type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{getIncidentTypeLabel(type)}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};