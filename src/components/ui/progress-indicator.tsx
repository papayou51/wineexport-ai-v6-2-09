import React from "react";
import { Loader2, CheckCircle, XCircle, Clock, Pause } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProgressStatus = "pending" | "running" | "completed" | "error" | "paused";

export interface ProgressStep {
  id: string;
  label: string;
  status: ProgressStatus;
  progress?: number;
  description?: string;
  estimatedTime?: number; // en secondes
  actualTime?: number; // en secondes
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepId?: string;
  overall?: {
    progress: number;
    estimatedTimeRemaining?: number;
    startTime?: Date;
  };
  variant?: "compact" | "detailed" | "minimal";
  showTimeEstimates?: boolean;
  onRetry?: (stepId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

const getStatusIcon = (status: ProgressStatus, className?: string) => {
  const iconClass = cn("h-4 w-4", className);
  
  switch (status) {
    case "completed":
      return <CheckCircle className={cn(iconClass, "text-green-500")} />;
    case "error":
      return <XCircle className={cn(iconClass, "text-destructive")} />;
    case "running":
      return <Loader2 className={cn(iconClass, "text-primary animate-spin")} />;
    case "paused":
      return <Pause className={cn(iconClass, "text-yellow-500")} />;
    case "pending":
    default:
      return <Clock className={cn(iconClass, "text-muted-foreground")} />;
  }
};

const getStatusColor = (status: ProgressStatus) => {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "error":
      return "bg-destructive";
    case "running":
      return "bg-primary";
    case "paused":
      return "bg-yellow-500";
    case "pending":
    default:
      return "bg-muted-foreground";
  }
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`;
  }
  return `${Math.round(seconds / 3600)}h`;
};

const StatusBadge = ({ status }: { status: ProgressStatus }) => {
  const getStatusLabel = (status: ProgressStatus) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "running":
        return "En cours";
      case "completed":
        return "Terminé";
      case "error":
        return "Erreur";
      case "paused":
        return "En pause";
      default:
        return "Inconnu";
    }
  };

  const getVariant = (status: ProgressStatus) => {
    switch (status) {
      case "completed":
        return "default";
      case "error":
        return "destructive";
      case "running":
        return "default";
      case "paused":
        return "secondary";
      case "pending":
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getVariant(status)} className="text-xs">
      {getStatusLabel(status)}
    </Badge>
  );
};

const CompactProgress: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepId,
  overall,
  showTimeEstimates,
}) => {
  const currentStep = steps.find(step => step.id === currentStepId);
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const totalSteps = steps.length;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {currentStep ? currentStep.label : "Traitement terminé"}
        </span>
        <span className="text-muted-foreground">
          {completedSteps}/{totalSteps}
        </span>
      </div>
      
      <Progress 
        value={overall?.progress || (completedSteps / totalSteps) * 100} 
        className="h-2"
      />
      
      {showTimeEstimates && overall?.estimatedTimeRemaining && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Temps restant estimé</span>
          <span>{formatTime(overall.estimatedTimeRemaining)}</span>
        </div>
      )}
    </div>
  );
};

const DetailedProgress: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepId,
  overall,
  showTimeEstimates,
  onRetry,
}) => {
  return (
    <Card className="p-4 space-y-4">
      {overall && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Progression globale</h3>
            <span className="text-sm text-muted-foreground">
              {Math.round(overall.progress)}%
            </span>
          </div>
          <Progress value={overall.progress} className="h-3" />
          {showTimeEstimates && overall.estimatedTimeRemaining && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Temps restant estimé</span>
              <span>{formatTime(overall.estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Étapes</h4>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-colors",
              step.id === currentStepId && "bg-accent/50 border-primary/20"
            )}
          >
            <div className="flex items-center gap-2 flex-1">
              {getStatusIcon(step.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{step.label}</span>
                  <StatusBadge status={step.status} />
                </div>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
                {step.status === "running" && step.progress !== undefined && (
                  <Progress value={step.progress} className="h-1 mt-2" />
                )}
              </div>
            </div>
            
            {showTimeEstimates && (step.estimatedTime || step.actualTime) && (
              <div className="text-xs text-muted-foreground text-right">
                {step.actualTime ? (
                  <span>{formatTime(step.actualTime)}</span>
                ) : step.estimatedTime ? (
                  <span>~{formatTime(step.estimatedTime)}</span>
                ) : null}
              </div>
            )}
            
            {step.status === "error" && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(step.id)}
                className="h-7 px-2 text-xs"
              >
                Réessayer
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

const MinimalProgress: React.FC<ProgressIndicatorProps> = ({
  steps,
  overall,
}) => {
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const totalSteps = steps.length;
  const hasError = steps.some(step => step.status === "error");
  
  return (
    <div className="flex items-center gap-2">
      {hasError ? (
        <XCircle className="h-4 w-4 text-destructive" />
      ) : completedSteps === totalSteps ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
      )}
      <Progress 
        value={overall?.progress || (completedSteps / totalSteps) * 100} 
        className="h-2 flex-1"
      />
      <span className="text-xs text-muted-foreground min-w-fit">
        {completedSteps}/{totalSteps}
      </span>
    </div>
  );
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  variant = "detailed",
  className,
  ...props
}) => {
  const Component = {
    compact: CompactProgress,
    detailed: DetailedProgress,
    minimal: MinimalProgress,
  }[variant];

  return (
    <div className={className}>
      <Component {...props} />
    </div>
  );
};