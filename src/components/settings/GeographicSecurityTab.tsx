import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Globe, Shield, Plus, X, MapPin, Users } from 'lucide-react';
import { useGeographicSecurityRules } from '@/hooks/useGeographicSecurityRules';
import { useToast } from '@/hooks/use-toast';

interface GeographicRule {
  id: string;
  rule_type: 'allow_country' | 'block_country' | 'allow_region' | 'block_region' | 'geofence';
  rule_value: string;
  is_active: boolean;
  priority: number;
  metadata?: any;
  created_at: string;
}

const COMMON_COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'États-Unis' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australie' },
  { code: 'JP', name: 'Japon' },
  { code: 'CN', name: 'Chine' },
  { code: 'RU', name: 'Russie' },
  { code: 'BR', name: 'Brésil' }
];

const getRuleTypeLabel = (type: string) => {
  switch (type) {
    case 'allow_country': return 'Autoriser pays';
    case 'block_country': return 'Bloquer pays';
    case 'allow_region': return 'Autoriser région';
    case 'block_region': return 'Bloquer région';
    case 'geofence': return 'Périmètre géographique';
    default: return type;
  }
};

const getRuleIcon = (type: string) => {
  switch (type) {
    case 'allow_country':
    case 'allow_region':
      return <Shield className="h-4 w-4 text-green-500" />;
    case 'block_country':
    case 'block_region':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'geofence':
      return <MapPin className="h-4 w-4 text-blue-500" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
};

export const GeographicSecurityTab = () => {
  const { rules, loading, createRule, updateRule, deleteRule } = useGeographicSecurityRules();
  const { toast } = useToast();
  
  const [newRule, setNewRule] = useState({
    type: 'block_country' as const,
    value: '',
    priority: 0
  });
  
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRule = async () => {
    if (!newRule.value.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une valeur pour la règle",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await createRule({
        rule_type: newRule.type,
        rule_value: newRule.value.trim().toUpperCase(),
        priority: newRule.priority,
        is_active: true
      });
      
      setNewRule({ type: 'block_country', value: '', priority: 0 });
      toast({
        title: "Succès",
        description: "Règle géographique créée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRule = async (rule: GeographicRule) => {
    try {
      await updateRule(rule.id, { is_active: !rule.is_active });
      toast({
        title: "Succès",
        description: `Règle ${rule.is_active ? 'désactivée' : 'activée'}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
      toast({
        title: "Succès",
        description: "Règle supprimée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeRules = rules.filter(r => r.is_active);
  const blockedCountries = rules.filter(r => r.rule_type === 'block_country' && r.is_active);
  const allowedCountries = rules.filter(r => r.rule_type === 'allow_country' && r.is_active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sécurité géographique
          </CardTitle>
          <CardDescription>
            Configurez les règles d'accès basées sur la géolocalisation pour protéger votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Règles ({activeRules.length})
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-6 space-y-6">
              {/* Créer une nouvelle règle */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajouter une règle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Type de règle</Label>
                      <Select
                        value={newRule.type}
                        onValueChange={(value: any) => setNewRule(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="block_country">Bloquer pays</SelectItem>
                          <SelectItem value="allow_country">Autoriser pays</SelectItem>
                          <SelectItem value="block_region">Bloquer région</SelectItem>
                          <SelectItem value="allow_region">Autoriser région</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Valeur</Label>
                      {newRule.type.includes('country') ? (
                        <Select
                          value={newRule.value}
                          onValueChange={(value) => setNewRule(prev => ({ ...prev, value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un pays" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_COUNTRIES.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Ex: Europe, Asie..."
                          value={newRule.value}
                          onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                        />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newRule.priority}
                        onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button 
                        onClick={handleCreateRule}
                        disabled={isCreating || !newRule.value.trim()}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des règles existantes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Règles configurées</h3>
                  <Badge variant="outline">
                    {rules.length} règle{rules.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                {rules.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucune règle configurée</h3>
                      <p className="text-muted-foreground mb-4">
                        Ajoutez des règles géographiques pour sécuriser l'accès à votre organisation
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {rules
                      .sort((a, b) => b.priority - a.priority)
                      .map((rule) => (
                      <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getRuleIcon(rule.rule_type)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {getRuleTypeLabel(rule.rule_type)}
                                  </span>
                                  <Badge variant="secondary">
                                    {rule.rule_value}
                                  </Badge>
                                  {rule.priority > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Priorité: {rule.priority}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Créée le {new Date(rule.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.is_active}
                                onCheckedChange={() => handleToggleRule(rule)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
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
              </div>
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Pays autorisés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allowedCountries.length === 0 ? (
                      <p className="text-muted-foreground">Aucune restriction (tous autorisés)</p>
                    ) : (
                      <div className="space-y-2">
                        {allowedCountries.map(rule => (
                          <Badge key={rule.id} variant="outline" className="mr-2">
                            {rule.rule_value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Pays bloqués</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {blockedCountries.length === 0 ? (
                      <p className="text-muted-foreground">Aucun pays bloqué</p>
                    ) : (
                      <div className="space-y-2">
                        {blockedCountries.map(rule => (
                          <Badge key={rule.id} variant="destructive" className="mr-2">
                            {rule.rule_value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total des règles:</span>
                      <span className="font-medium">{rules.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Règles actives:</span>
                      <span className="font-medium">{activeRules.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pays bloqués:</span>
                      <span className="font-medium">{blockedCountries.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};