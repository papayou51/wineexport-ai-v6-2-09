import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useProjectAnalyses, useRunAnalysis } from '@/hooks/useAnalyses';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';

const ProjectAnalysis = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: analyses, isLoading: analysesLoading, refetch: refetchAnalyses } = useProjectAnalyses(id!);
  const runAnalysis = useRunAnalysis();
  const { trackAnalysisWorkflow } = useUserAnalytics();

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [runningAnalyses, setRunningAnalyses] = useState<Set<string>>(new Set());
  const [completedAnalyses, setCompletedAnalyses] = useState<Set<string>>(new Set());

  // Progress tracker for the overall workflow
  const progressTracker = useProgressTracker([
    {
      id: 'setup',
      label: 'Configuration',
      description: 'Sélection du pays et préparation',
      estimatedTime: 5,
    },
    {
      id: 'market_study',
      label: 'Étude de marché',
      description: 'Analyse de la taille du marché et concurrence',
      estimatedTime: 45,
    },
    {
      id: 'regulatory_analysis',
      label: 'Analyse réglementaire',
      description: 'Exigences d\'importation et certifications',
      estimatedTime: 35,
    },
    {
      id: 'lead_generation',
      label: 'Génération de leads',
      description: 'Identification de distributeurs potentiels',
      estimatedTime: 60,
    },
    {
      id: 'marketing_intelligence',
      label: 'Intelligence marketing',
      description: 'Stratégies marketing et positionnement',
      estimatedTime: 40,
    },
  ], {
    onComplete: () => {
      toast({
        title: "Analyse complète terminée",
        description: "Toutes les analyses ont été réalisées avec succès.",
      });
    },
  });

  // Check existing analyses to update progress
  useEffect(() => {
    if (analyses && selectedCountry) {
      const countryAnalyses = analyses.filter(a => a.country_code === selectedCountry);
      const types = new Set(countryAnalyses.map(a => a.analysis_type));
      
      setCompletedAnalyses(types);
      
      // Update progress tracker based on completed analyses
      if (types.has('market_study')) {
        progressTracker.completeStep('market_study');
      }
      if (types.has('regulatory_analysis')) {
        progressTracker.completeStep('regulatory_analysis');
      }
      if (types.has('lead_generation')) {
        progressTracker.completeStep('lead_generation');
      }
      if (types.has('marketing_intelligence')) {
        progressTracker.completeStep('marketing_intelligence');
      }
    }
  }, [analyses, selectedCountry]);

  const handleCountrySelection = (country: string) => {
    setSelectedCountry(country);
    progressTracker.completeStep('setup');
  };

  const handleRunAllAnalyses = async () => {
    if (!selectedCountry) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un pays cible.",
        variant: "destructive",
      });
      return;
    }

    const analysisTypes = ['market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence'];
    
    for (const analysisType of analysisTypes) {
      if (completedAnalyses.has(analysisType)) continue;
      
      setRunningAnalyses(prev => new Set([...prev, analysisType]));
      progressTracker.startStep(analysisType);

      // Track analysis start
      await trackAnalysisWorkflow('analysis_started', analysisType, project!.id, selectedCountry);

      try {
        await runAnalysis.mutateAsync({
          projectId: project!.id,
          analysisType: analysisType as any,
          countryCode: selectedCountry,
          inputData: {
            products: project!.products,
            description: project!.description,
            budget_range: project!.budget_range,
            timeline: project!.timeline
          }
        });

        progressTracker.completeStep(analysisType);
        setCompletedAnalyses(prev => new Set([...prev, analysisType]));
        setRunningAnalyses(prev => {
          const newSet = new Set(prev);
          newSet.delete(analysisType);
          return newSet;
        });

        // Track analysis completion
        await trackAnalysisWorkflow('analysis_completed', analysisType, project!.id, selectedCountry);

        // Refresh analyses data
        refetchAnalyses();

      } catch (error) {
        progressTracker.errorStep(analysisType, 'Erreur lors de l\'analyse');
        setRunningAnalyses(prev => {
          const newSet = new Set(prev);
          newSet.delete(analysisType);
          return newSet;
        });
      }
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Export en cours",
      description: "Génération du rapport PDF...",
    });
    // TODO: Implement PDF export
  };

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

  const hasCompletedSetup = selectedCountry !== '';
  const hasCompletedAllAnalyses = completedAnalyses.size === 4;
  const hasRunningAnalyses = runningAnalyses.size > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">Analyse complète Cas 1</p>
          </div>
        </div>
        
        {hasCompletedAllAnalyses && (
          <Button onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter PDF
          </Button>
        )}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Progression de l'analyse
            {hasCompletedAllAnalyses && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </CardTitle>
          <CardDescription>
            Parcours complet d'analyse pour l'export vers {selectedCountry || 'le marché cible'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressIndicator
            steps={progressTracker.steps}
            currentStepId={progressTracker.currentStepId}
            overall={{
              progress: progressTracker.overallProgress,
              estimatedTimeRemaining: progressTracker.estimatedTimeRemaining || undefined,
            }}
            variant="detailed"
            showTimeEstimates
          />
        </CardContent>
      </Card>

      {/* Country Selection */}
      {!hasCompletedSetup && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>1. Sélection du marché cible</CardTitle>
            <CardDescription>
              Choisissez le pays pour lequel vous souhaitez réaliser l'analyse complète
            </CardDescription>
          </CardHeader>
          <CardContent>
            {project.target_countries && project.target_countries.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {project.target_countries.map((country) => (
                  <Button
                    key={country}
                    variant="outline"
                    onClick={() => handleCountrySelection(country)}
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <div className="font-medium">{country}</div>
                      <div className="text-xs text-muted-foreground">
                        Marché d'export
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Aucun pays cible défini pour ce projet. 
                <Button variant="link" onClick={() => navigate(`/projects/${id}/edit`)} className="p-0 ml-1">
                  Modifier le projet
                </Button>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Launch */}
      {hasCompletedSetup && !hasCompletedAllAnalyses && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>2. Lancement des analyses</CardTitle>
            <CardDescription>
              Lancer toutes les analyses nécessaires pour {selectedCountry}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analyses à réaliser :</p>
                <div className="flex gap-2 mt-2">
                  {['market_study', 'regulatory_analysis', 'lead_generation', 'marketing_intelligence'].map(type => (
                    <Badge 
                      key={type} 
                      variant={completedAnalyses.has(type) ? "default" : runningAnalyses.has(type) ? "secondary" : "outline"}
                    >
                      {type === 'market_study' ? 'Marché' :
                       type === 'regulatory_analysis' ? 'Réglementation' :
                       type === 'lead_generation' ? 'Leads' : 'Marketing'}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleRunAllAnalyses}
                disabled={hasRunningAnalyses}
                className="gap-2"
              >
                {hasRunningAnalyses ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {hasRunningAnalyses ? 'Analyses en cours...' : 'Lancer toutes les analyses'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Dashboard */}
      {hasCompletedSetup && (analyses && analyses.length > 0) && (
        <AnalysisDashboard 
          projectId={project.id}
          countryCode={selectedCountry}
          analyses={analyses.filter(a => a.country_code === selectedCountry)}
          projectName={project.name}
        />
      )}
    </div>
  );
};

export default ProjectAnalysis;