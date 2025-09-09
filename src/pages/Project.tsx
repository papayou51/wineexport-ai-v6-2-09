import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useProjectAnalyses, useRunAnalysis } from '@/hooks/useAnalyses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, FileText, Users, TrendingUp, Shield, BarChart, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: analyses, isLoading: analysesLoading } = useProjectAnalyses(id!);
  const runAnalysis = useRunAnalysis();

  if (projectLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Projet non trouvé</h1>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'market_study': return <TrendingUp className="h-4 w-4" />;
      case 'regulatory_analysis': return <Shield className="h-4 w-4" />;
      case 'lead_generation': return <Users className="h-4 w-4" />;
      case 'marketing_intelligence': return <BarChart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'market_study': return 'Étude de marché';
      case 'regulatory_analysis': return 'Analyse réglementaire';
      case 'lead_generation': return 'Génération de leads';
      case 'marketing_intelligence': return 'Intelligence marketing';
      case 'full_analysis': return 'Analyse complète';
      default: return type;
    }
  };

  const handleRunAnalysis = async (analysisType: string, countryCode: string) => {
    try {
      await runAnalysis.mutateAsync({
        projectId: project.id,
        analysisType: analysisType as any,
        countryCode,
        inputData: {
          products: project.products,
          description: project.description,
          budget_range: project.budget_range,
          timeline: project.timeline
        }
      });
      
      toast({
        title: "Analyse lancée",
        description: `L'analyse ${getTypeLabel(analysisType)} a été lancée avec succès.`,
      });
    } catch (error) {
      console.error('Error running analysis:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux projets
        </Button>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {project.status === 'draft' ? 'Brouillon' : 
               project.status === 'running' ? 'En cours' : 
               project.status === 'completed' ? 'Terminé' : 
               project.status === 'failed' ? 'Échoué' : project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Type de projet</h4>
              <p className="text-sm">{getTypeLabel(project.project_type)}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Budget</h4>
              <p className="text-sm">{project.budget_range || 'Non défini'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Chronologie</h4>
              <p className="text-sm">{project.timeline || 'Non définie'}</p>
            </div>
          </div>
          
          {project.target_countries && project.target_countries.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Pays cibles</h4>
              <div className="flex flex-wrap gap-2">
                {project.target_countries.map((country) => (
                  <Badge key={country} variant="outline">{country}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Section */}
      <Tabs defaultValue="run" className="space-y-4">
        <TabsList>
          <TabsTrigger value="run">Lancer une analyse</TabsTrigger>
          <TabsTrigger value="results">Résultats d'analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyses disponibles</CardTitle>
              <CardDescription>
                Sélectionnez le type d'analyse à effectuer pour ce projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    type: 'market_study',
                    title: 'Étude de marché',
                    description: 'Analyse de la taille du marché, concurrence et opportunités',
                    icon: <TrendingUp className="h-5 w-5" />
                  },
                  {
                    type: 'regulatory_analysis',
                    title: 'Analyse réglementaire',
                    description: 'Exigences d\'importation, taxes et certifications',
                    icon: <Shield className="h-5 w-5" />
                  },
                  {
                    type: 'lead_generation',
                    title: 'Génération de leads',
                    description: 'Identification de distributeurs et partenaires potentiels',
                    icon: <Users className="h-5 w-5" />
                  },
                  {
                    type: 'marketing_intelligence',
                    title: 'Intelligence marketing',
                    description: 'Stratégies marketing et positionnement produit',
                    icon: <BarChart className="h-5 w-5" />
                  }
                ].map((analysis) => (
                  <Card key={analysis.type} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {analysis.icon}
                        <CardTitle className="text-lg">{analysis.title}</CardTitle>
                      </div>
                      <CardDescription>{analysis.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {project.target_countries && project.target_countries.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Sélectionnez un pays :</p>
                          <div className="grid grid-cols-1 gap-2">
                            {project.target_countries.map((country) => (
                              <Button
                                key={country}
                                variant="outline"
                                size="sm"
                                className="justify-start gap-2"
                                onClick={() => handleRunAnalysis(analysis.type, country)}
                                disabled={runAnalysis.isPending}
                              >
                                <Play className="h-3 w-3" />
                                {country}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucun pays cible défini pour ce projet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des analyses</CardTitle>
              <CardDescription>
                Résultats des analyses effectuées pour ce projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : analyses && analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(analysis.analysis_type)}
                            <div>
                              <h4 className="font-medium">{getTypeLabel(analysis.analysis_type)}</h4>
                              <p className="text-sm text-muted-foreground">
                                {analysis.country_code} • {formatDate(analysis.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {analysis.processing_time_ms}ms
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/analysis/${analysis.id}`)}
                            >
                              Voir le rapport
                            </Button>
                            {analysis.analysis_type === 'lead_generation' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/projects/${id}/leads`)}
                                className="gap-1"
                              >
                                <Users className="h-3 w-3" />
                                Voir les leads
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune analyse</h3>
                  <p className="text-muted-foreground">
                    Aucune analyse n'a encore été effectuée pour ce projet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Project;