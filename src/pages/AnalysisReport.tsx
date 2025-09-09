import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/hooks/useAnalyses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Download, Calendar, Clock, Star } from 'lucide-react';

const AnalysisReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: analysis, isLoading } = useAnalysis(id!);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'market_study': return 'Étude de marché';
      case 'regulatory_analysis': return 'Analyse réglementaire';
      case 'lead_generation': return 'Génération de leads';
      case 'marketing_intelligence': return 'Intelligence marketing';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMarketStudyResults = (results: any) => {
    if (!results) return null;

    return (
      <div className="space-y-6">
        {results.market_size && (
          <Card>
            <CardHeader>
              <CardTitle>Taille du marché</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.market_size.value && (
                  <div>
                    <p className="font-medium">Valeur du marché</p>
                    <p className="text-2xl font-bold text-primary">{results.market_size.value}</p>
                  </div>
                )}
                {results.market_size.growth_rate && (
                  <div>
                    <p className="font-medium">Taux de croissance</p>
                    <p className="text-2xl font-bold text-green-600">{results.market_size.growth_rate}</p>
                  </div>
                )}
              </div>
              {results.market_size.description && (
                <p className="mt-4 text-muted-foreground">{results.market_size.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {results.competitors && (
          <Card>
            <CardHeader>
              <CardTitle>Analyse concurrentielle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.competitors.map((competitor: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{competitor.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{competitor.description}</p>
                    {competitor.market_share && (
                      <Badge variant="outline" className="mt-2">
                        Part de marché: {competitor.market_share}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.opportunities && (
          <Card>
            <CardHeader>
              <CardTitle>Opportunités identifiées</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.opportunities.map((opportunity: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderRegulatoryResults = (results: any) => {
    if (!results) return null;

    return (
      <div className="space-y-6">
        {results.import_requirements && (
          <Card>
            <CardHeader>
              <CardTitle>Exigences d'importation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.import_requirements.map((req: any, index: number) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">{req.category}</h4>
                    <p className="text-sm text-muted-foreground">{req.description}</p>
                    {req.timeline && (
                      <Badge variant="outline" className="mt-2">
                        Délai: {req.timeline}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.certifications && (
          <Card>
            <CardHeader>
              <CardTitle>Certifications requises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.certifications.map((cert: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{cert.description}</p>
                    {cert.cost && (
                      <p className="text-sm font-medium mt-2">Coût estimé: {cert.cost}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.taxes_and_duties && (
          <Card>
            <CardHeader>
              <CardTitle>Taxes et droits de douane</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(results.taxes_and_duties).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">{key.replace('_', ' ')}</span>
                    <span className="text-primary font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderMarketingResults = (results: any) => {
    if (!results) return null;

    return (
      <div className="space-y-6">
        {results.positioning && (
          <Card>
            <CardHeader>
              <CardTitle>Positionnement recommandé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{results.positioning}</p>
            </CardContent>
          </Card>
        )}

        {results.marketing_channels && (
          <Card>
            <CardHeader>
              <CardTitle>Canaux marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.marketing_channels.map((channel: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{channel.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{channel.description}</p>
                    {channel.effectiveness && (
                      <Badge variant="outline" className="mt-2">
                        Efficacité: {channel.effectiveness}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.cultural_insights && (
          <Card>
            <CardHeader>
              <CardTitle>Considérations culturelles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.cultural_insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!analysis?.results) return null;

    switch (analysis.analysis_type) {
      case 'market_study':
        return renderMarketStudyResults(analysis.results);
      case 'regulatory_analysis':
        return renderRegulatoryResults(analysis.results);
      case 'marketing_intelligence':
        return renderMarketingResults(analysis.results);
      case 'lead_generation':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Leads générés</CardTitle>
              <CardDescription>
                Consultez la page dédiée aux leads pour voir les prospects identifiés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/projects/${analysis.project_id}/leads`)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Voir les leads
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(analysis.results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Analyse non trouvée</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${analysis.project_id}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au projet
        </Button>
      </div>

      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{getTypeLabel(analysis.analysis_type)}</CardTitle>
              <CardDescription>
                Analyse réalisée le {formatDate(analysis.created_at)}
                {analysis.country_code && ` pour ${analysis.country_code}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {analysis.confidence_score && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  {Math.round(analysis.confidence_score * 100)}% de confiance
                </Badge>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Type d'analyse</h4>
              <p className="text-sm">{getTypeLabel(analysis.analysis_type)}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Temps de traitement</h4>
              <p className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {analysis.processing_time_ms}ms
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Modèle utilisé</h4>
              <p className="text-sm">{analysis.llm_model_used || 'Non spécifié'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats de l'analyse</CardTitle>
        </CardHeader>
        <CardContent>
          {renderResults()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisReport;