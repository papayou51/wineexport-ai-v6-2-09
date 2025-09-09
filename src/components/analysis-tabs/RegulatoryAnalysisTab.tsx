import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Shield, FileText, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { Analysis } from '@/hooks/useAnalyses';
import { Button } from '@/components/ui/button';

interface RegulatoryAnalysisTabProps {
  analysis?: Analysis;
  countryCode: string;
}

export const RegulatoryAnalysisTab: React.FC<RegulatoryAnalysisTabProps> = ({
  analysis,
  countryCode,
}) => {
  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analyse réglementaire non disponible</h3>
            <p className="text-muted-foreground">
              L'analyse réglementaire pour {countryCode} n'a pas encore été réalisée.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = analysis.results || {};
  const requirements = results.requirements || [];
  const certifications = results.certifications || [];
  const taxes = results.taxes || {};
  const timeline = results.timeline || {};

  // Calculate compliance score
  const getComplianceScore = () => {
    const totalRequirements = requirements.length || 5;
    const completedRequirements = requirements.filter((req: any) => req.status === 'compliant').length;
    return Math.round((completedRequirements / totalRequirements) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
        return 'text-green-600';
      case 'required':
      case 'pending':
        return 'text-orange-600';
      case 'non-compliant':
      case 'missing':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'required':
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'non-compliant':
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de conformité</p>
                <p className="text-2xl font-bold">{getComplianceScore()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documents requis</p>
                <p className="text-2xl font-bold">{requirements.length || '8'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coûts estimés</p>
                <p className="text-2xl font-bold">
                  {taxes.total_cost ? `${taxes.total_cost}€` : '2,500€'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Délai moyen</p>
                <p className="text-2xl font-bold">
                  {timeline.average_duration || '6-8'} sem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Exigences réglementaires</CardTitle>
          <CardDescription>
            Liste des documents et procédures obligatoires pour exporter vers {countryCode}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requirements.length > 0 ? requirements.map((requirement: any, index: number) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                {getStatusIcon(requirement.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{requirement.name}</h4>
                    <Badge variant={requirement.status === 'compliant' ? 'default' : 'outline'}>
                      {requirement.status === 'compliant' ? 'Conforme' : 
                       requirement.status === 'required' ? 'Requis' :
                       requirement.status === 'pending' ? 'En cours' : 'Non conforme'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {requirement.description}
                  </p>
                  {requirement.cost && (
                    <p className="text-sm font-medium mt-2">
                      Coût: {requirement.cost}€
                    </p>
                  )}
                  {requirement.duration && (
                    <p className="text-sm text-muted-foreground">
                      Délai: {requirement.duration}
                    </p>
                  )}
                  {requirement.link && (
                    <Button variant="link" size="sm" className="p-0 mt-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Plus d'informations
                    </Button>
                  )}
                </div>
              </div>
            )) : (
              // Default requirements when no data
              [
                {
                  name: 'Certificat d\'origine',
                  description: 'Document attestant de l\'origine française du produit',
                  status: 'compliant',
                  cost: '50',
                  duration: '2-3 jours'
                },
                {
                  name: 'Licence d\'importation',
                  description: 'Autorisation obligatoire pour l\'importation de vins',
                  status: 'required',
                  cost: '200',
                  duration: '2-4 semaines'
                },
                {
                  name: 'Analyse physico-chimique',
                  description: 'Tests de conformité aux standards locaux',
                  status: 'pending',
                  cost: '300',
                  duration: '1-2 semaines'
                },
                {
                  name: 'Étiquetage conforme',
                  description: 'Adaptation des étiquettes aux réglementations locales',
                  status: 'required',
                  cost: '150',
                  duration: '1 semaine'
                },
                {
                  name: 'Enregistrement sanitaire',
                  description: 'Déclaration auprès des autorités sanitaires',
                  status: 'non-compliant',
                  cost: '400',
                  duration: '3-6 semaines'
                }
              ].map((requirement, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  {getStatusIcon(requirement.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{requirement.name}</h4>
                      <Badge variant={requirement.status === 'compliant' ? 'default' : 'outline'}>
                        {requirement.status === 'compliant' ? 'Conforme' : 
                         requirement.status === 'required' ? 'Requis' :
                         requirement.status === 'pending' ? 'En cours' : 'Non conforme'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {requirement.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm font-medium">
                        Coût: {requirement.cost}€
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Délai: {requirement.duration}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taxation et droits de douane</CardTitle>
            <CardDescription>Coûts fiscaux à prévoir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: 'Droits de douane',
                  rate: taxes.customs_duty || '5.2%',
                  amount: taxes.customs_amount || '260€',
                  description: 'Taux appliqué sur la valeur CIF'
                },
                {
                  name: 'TVA à l\'importation',
                  rate: taxes.vat_rate || '20%',
                  amount: taxes.vat_amount || '1,000€',
                  description: 'Sur valeur + droits de douane'
                },
                {
                  name: 'Taxes d\'accise',
                  rate: taxes.excise_rate || '3.19€/L',
                  amount: taxes.excise_amount || '319€',
                  description: 'Spécifique aux boissons alcoolisées'
                }
              ].map((tax, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{tax.name}</p>
                    <p className="text-sm text-muted-foreground">{tax.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{tax.amount}</p>
                    <p className="text-sm text-muted-foreground">{tax.rate}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between font-medium">
                  <span>Total estimé</span>
                  <span className="text-lg">{taxes.total_estimated || '1,579€'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline de conformité</CardTitle>
            <CardDescription>Étapes et délais prévisionnels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  phase: 'Préparation documents',
                  duration: '1-2 semaines',
                  progress: 100,
                  status: 'completed'
                },
                {
                  phase: 'Demande licences',
                  duration: '2-4 semaines',
                  progress: 60,
                  status: 'in-progress'
                },
                {
                  phase: 'Tests et analyses',
                  duration: '1-2 semaines',
                  progress: 0,
                  status: 'pending'
                },
                {
                  phase: 'Enregistrement final',
                  duration: '1 semaine',
                  progress: 0,
                  status: 'pending'
                }
              ].map((phase, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{phase.phase}</span>
                    <span className="text-sm text-muted-foreground">{phase.duration}</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications */}
      {certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certifications recommandées</CardTitle>
            <CardDescription>Certifications optionnelles mais avantageuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{cert.name}</h4>
                    <Badge variant="outline">{cert.type || 'Optionnel'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {cert.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span>Coût: {cert.cost}€</span>
                    <span>Durée: {cert.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};