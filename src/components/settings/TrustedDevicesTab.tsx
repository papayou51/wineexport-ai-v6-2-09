import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Monitor, Smartphone, Tablet, Shield, AlertTriangle, X, Edit2, Check } from 'lucide-react';
import { useTrustedDevices } from '@/hooks/useTrustedDevices';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name?: string;
  device_type?: string;
  os_details?: string;
  browser?: string;
  screen_resolution?: string;
  timezone?: string;
  first_seen: string;
  last_seen: string;
  trust_score: number;
  is_trusted: boolean;
  metadata?: any;
}

const getDeviceIcon = (deviceType?: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
    case 'smartphone':
      return <Smartphone className="h-5 w-5" />;
    case 'tablet':
      return <Tablet className="h-5 w-5" />;
    case 'desktop':
    case 'laptop':
    default:
      return <Monitor className="h-5 w-5" />;
  }
};

const getTrustScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-950';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
  return 'text-red-600 bg-red-50 dark:bg-red-950';
};

export const TrustedDevicesTab = () => {
  const { devices, loading, updateDevice, deleteDevice } = useTrustedDevices();
  const { toast } = useToast();
  
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleToggleTrust = async (device: TrustedDevice) => {
    try {
      await updateDevice(device.id, { is_trusted: !device.is_trusted });
      toast({
        title: "Succès",
        description: `Appareil ${device.is_trusted ? 'révoqué' : 'approuvé'}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'appareil",
        variant: "destructive"
      });
    }
  };

  const handleStartEdit = (device: TrustedDevice) => {
    setEditingDevice(device.id);
    setEditName(device.device_name || '');
  };

  const handleSaveEdit = async (deviceId: string) => {
    try {
      await updateDevice(deviceId, { device_name: editName.trim() || null });
      setEditingDevice(null);
      setEditName('');
      toast({
        title: "Succès",
        description: "Nom de l'appareil mis à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le nom",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setEditName('');
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await deleteDevice(deviceId);
      toast({
        title: "Succès",
        description: "Appareil supprimé"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'appareil",
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

  const trustedDevices = devices.filter(d => d.is_trusted);
  const untrustedDevices = devices.filter(d => !d.is_trusted);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Appareils de confiance
          </CardTitle>
          <CardDescription>
            Gérez les appareils autorisés à accéder à votre compte sans vérifications supplémentaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Appareils approuvés</p>
                    <p className="text-2xl font-bold text-green-600">{trustedDevices.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600">{untrustedDevices.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{devices.length}</p>
                  </div>
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des appareils */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Vos appareils</h3>
              {untrustedDevices.length > 0 && (
                <Badge variant="destructive">
                  {untrustedDevices.length} en attente d'approbation
                </Badge>
              )}
            </div>

            {devices.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun appareil enregistré</h3>
                  <p className="text-muted-foreground">
                    Connectez-vous depuis différents appareils pour les voir apparaître ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {devices
                  .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
                  .map((device) => (
                  <Card 
                    key={device.id} 
                    className={`transition-all ${
                      device.is_trusted 
                        ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' 
                        : 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getDeviceIcon(device.device_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {editingDevice === device.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Nom de l'appareil"
                                    className="h-8 w-48"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveEdit(device.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-medium">
                                    {device.device_name || `${device.device_type || 'Appareil'} inconnu`}
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(device)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              
                              {device.is_trusted ? (
                                <Badge variant="default" className="bg-green-600">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Approuvé
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  En attente
                                </Badge>
                              )}
                              
                              <Badge 
                                variant="outline" 
                                className={getTrustScoreColor(device.trust_score)}
                              >
                                Score: {device.trust_score}/100
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-4 flex-wrap">
                                {device.browser && (
                                  <span>Navigateur: {device.browser}</span>
                                )}
                                {device.os_details && (
                                  <span>OS: {device.os_details}</span>
                                )}
                                {device.screen_resolution && (
                                  <span>Écran: {device.screen_resolution}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span>
                                  Première utilisation: {formatDistanceToNow(new Date(device.first_seen), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })}
                                </span>
                                <span>
                                  Dernière utilisation: {formatDistanceToNow(new Date(device.last_seen), { 
                                    addSuffix: true, 
                                    locale: fr 
                                  })}
                                </span>
                              </div>
                              {device.timezone && (
                                <div className="text-xs opacity-75">
                                  Fuseau horaire: {device.timezone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`trust-${device.id}`} className="text-sm">
                              {device.is_trusted ? 'Approuvé' : 'Approuver'}
                            </Label>
                            <Switch
                              id={`trust-${device.id}`}
                              checked={device.is_trusted}
                              onCheckedChange={() => handleToggleTrust(device)}
                            />
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {untrustedDevices.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Appareils en attente d'approbation</p>
                    <p>
                      {untrustedDevices.length} appareil{untrustedDevices.length > 1 ? 's' : ''} 
                      {' '}nécessite{untrustedDevices.length > 1 ? 'nt' : ''} votre approbation. 
                      Les appareils non approuvés peuvent déclencher des vérifications de sécurité supplémentaires.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};