import { useState, useCallback, useRef, useEffect } from "react";
import type { ProgressStatus, ProgressStep } from "@/components/ui/progress-indicator";

interface ProgressTrackerOptions {
  autoProgress?: boolean;
  estimatedTimes?: Record<string, number>; // en secondes
  onComplete?: () => void;
  onError?: (stepId: string, error: string) => void;
}

interface UseProgressTrackerReturn {
  steps: ProgressStep[];
  currentStepId: string | null;
  overallProgress: number;
  estimatedTimeRemaining: number | null;
  isComplete: boolean;
  hasError: boolean;
  isPaused: boolean;
  startStep: (stepId: string, description?: string) => void;
  completeStep: (stepId: string, actualTime?: number) => void;
  errorStep: (stepId: string, error: string) => void;
  updateStepProgress: (stepId: string, progress: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addStep: (step: Omit<ProgressStep, "status">) => void;
  removeStep: (stepId: string) => void;
}

export const useProgressTracker = (
  initialSteps: Array<Omit<ProgressStep, "status">>,
  options: ProgressTrackerOptions = {}
): UseProgressTrackerReturn => {
  const { autoProgress = false, estimatedTimes = {}, onComplete, onError } = options;
  
  const [steps, setSteps] = useState<ProgressStep[]>(
    initialSteps.map(step => ({
      ...step,
      status: "pending" as ProgressStatus,
      estimatedTime: estimatedTimes[step.id] || step.estimatedTime,
    }))
  );
  
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const stepStartTimes = useRef<Record<string, Date>>({});

  // Calculer la progression globale
  const overallProgress = steps.length > 0 
    ? (steps.filter(step => step.status === "completed").length / steps.length) * 100
    : 0;

  // Vérifier si terminé ou en erreur
  const isComplete = steps.length > 0 && steps.every(step => step.status === "completed");
  const hasError = steps.some(step => step.status === "error");

  // Calculer le temps restant estimé
  const estimatedTimeRemaining = (() => {
    if (isPaused || isComplete || hasError) return null;
    
    const remainingSteps = steps.filter(step => 
      step.status === "pending" || step.status === "running"
    );
    
    const totalEstimatedTime = remainingSteps.reduce((total, step) => {
      return total + (step.estimatedTime || 0);
    }, 0);

    // Ajuster basé sur le temps écoulé du step actuel
    if (currentStepId && stepStartTimes.current[currentStepId]) {
      const currentStep = steps.find(s => s.id === currentStepId);
      if (currentStep?.estimatedTime) {
        const elapsed = (Date.now() - stepStartTimes.current[currentStepId].getTime()) / 1000;
        const remaining = Math.max(0, currentStep.estimatedTime - elapsed);
        // Add more intelligent time estimation based on actual performance
        const adaptiveTime = remaining * (currentStep.progress ? (100 - (currentStep.progress || 0)) / 100 : 1);
        return totalEstimatedTime - (currentStep.estimatedTime - adaptiveTime);
      }
    }

    return totalEstimatedTime > 0 ? totalEstimatedTime : null;
  })();

  // Démarrer une étape
  const startStep = useCallback((stepId: string, description?: string) => {
    if (isPaused) return;

    setSteps(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, status: "running" as ProgressStatus, description: description || step.description }
        : step
    ));
    setCurrentStepId(stepId);
    stepStartTimes.current[stepId] = new Date();
    
    if (!startTime) {
      setStartTime(new Date());
    }
  }, [isPaused, startTime]);

  // Terminer une étape
  const completeStep = useCallback((stepId: string, actualTime?: number) => {
    if (isPaused) return;

    setSteps(prev => {
      const updated = prev.map(step =>
        step.id === stepId
          ? { 
              ...step, 
              status: "completed" as ProgressStatus, 
              progress: 100,
              actualTime: actualTime || (stepStartTimes.current[stepId] 
                ? (Date.now() - stepStartTimes.current[stepId].getTime()) / 1000 
                : undefined)
            }
          : step
      );

      // Auto-démarrer l'étape suivante si activé
      if (autoProgress) {
        const currentIndex = updated.findIndex(s => s.id === stepId);
        const nextStep = updated[currentIndex + 1];
        if (nextStep && nextStep.status === "pending") {
          setTimeout(() => startStep(nextStep.id), 100);
        }
      }

      return updated;
    });

    if (stepStartTimes.current[stepId]) {
      delete stepStartTimes.current[stepId];
    }
  }, [isPaused, autoProgress, startStep]);

  // Marquer une étape en erreur
  const errorStep = useCallback((stepId: string, error: string) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, status: "error" as ProgressStatus, description: error }
        : step
    ));
    setCurrentStepId(null);
    
    if (stepStartTimes.current[stepId]) {
      delete stepStartTimes.current[stepId];
    }

    if (onError) {
      onError(stepId, error);
    }
  }, [onError]);

  // Mettre à jour la progression d'une étape
  const updateStepProgress = useCallback((stepId: string, progress: number) => {
    if (isPaused) return;

    setSteps(prev => prev.map(step =>
      step.id === stepId && step.status === "running"
        ? { ...step, progress: Math.min(100, Math.max(0, progress)) }
        : step
    ));
  }, [isPaused]);

  // Mettre en pause
  const pause = useCallback(() => {
    setIsPaused(true);
    setSteps(prev => prev.map(step =>
      step.status === "running"
        ? { ...step, status: "paused" as ProgressStatus }
        : step
    ));
  }, []);

  // Reprendre
  const resume = useCallback(() => {
    setIsPaused(false);
    setSteps(prev => prev.map(step =>
      step.status === "paused"
        ? { ...step, status: "running" as ProgressStatus }
        : step
    ));
  }, []);

  // Réinitialiser
  const reset = useCallback(() => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: "pending" as ProgressStatus,
      progress: undefined,
      actualTime: undefined,
    })));
    setCurrentStepId(null);
    setStartTime(null);
    setIsPaused(false);
    stepStartTimes.current = {};
  }, []);

  // Ajouter une étape
  const addStep = useCallback((step: Omit<ProgressStep, "status">) => {
    setSteps(prev => [...prev, {
      ...step,
      status: "pending" as ProgressStatus,
      estimatedTime: estimatedTimes[step.id] || step.estimatedTime,
    }]);
  }, [estimatedTimes]);

  // Supprimer une étape
  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId));
    if (currentStepId === stepId) {
      setCurrentStepId(null);
    }
    if (stepStartTimes.current[stepId]) {
      delete stepStartTimes.current[stepId];
    }
  }, [currentStepId]);

  // Callback quand tout est terminé
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return {
    steps,
    currentStepId,
    overallProgress,
    estimatedTimeRemaining,
    isComplete,
    hasError,
    isPaused,
    startStep,
    completeStep,
    errorStep,
    updateStepProgress,
    pause,
    resume,
    reset,
    addStep,
    removeStep,
  };
};

// Hook spécialisé pour le tracking des analyses
export const useAnalysisProgressTracker = (analysisType: string) => {
  const getAnalysisSteps = (type: string): Array<Omit<ProgressStep, "status">> => {
    const baseSteps = [
      {
        id: "validation",
        label: "Validation des données",
        description: "Vérification des données d'entrée",
        estimatedTime: 5,
      },
      {
        id: "processing",
        label: "Traitement des données",
        description: "Analyse en cours...",
        estimatedTime: 30,
      },
      {
        id: "generation",
        label: "Génération du rapport",
        description: "Création du rapport final",
        estimatedTime: 10,
      },
    ];

    // Ajouter des étapes spécifiques selon le type d'analyse
    switch (type) {
      case "market_analysis":
        return [
          ...baseSteps.slice(0, 2),
          {
            id: "market_research",
            label: "Recherche de marché",
            description: "Collecte des données de marché",
            estimatedTime: 45,
          },
          ...baseSteps.slice(2),
        ];
      case "regulatory_analysis":
        return [
          ...baseSteps.slice(0, 2),
          {
            id: "regulation_check",
            label: "Vérification réglementaire",
            description: "Analyse des réglementations",
            estimatedTime: 25,
          },
          ...baseSteps.slice(2),
        ];
      case "lead_generation":
        return [
          ...baseSteps.slice(0, 2),
          {
            id: "lead_search",
            label: "Recherche de prospects",
            description: "Identification des prospects potentiels",
            estimatedTime: 60,
          },
          {
            id: "lead_scoring",
            label: "Scoring des prospects",
            description: "Évaluation de la qualité des prospects",
            estimatedTime: 20,
          },
          ...baseSteps.slice(2),
        ];
      default:
        return baseSteps;
    }
  };

  return useProgressTracker(getAnalysisSteps(analysisType), {
    autoProgress: false, // Les analyses sont contrôlées par le backend
    onComplete: () => {
      console.log(`Analysis ${analysisType} completed`);
    },
    onError: (stepId, error) => {
      console.error(`Analysis ${analysisType} failed at step ${stepId}:`, error);
    },
  });
};