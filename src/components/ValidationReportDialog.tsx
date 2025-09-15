import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

interface ValidationReport {
  keptFields: number;
  droppedFields: number;
  noCitationFields: string[];
  invalidEvidenceFields: string[];
}

interface ValidationReportDialogProps {
  validationReport?: ValidationReport;
  rawData?: any;
  processedData?: any;
  qualityScore?: number;
  trigger?: React.ReactNode;
}

export function ValidationReportDialog({
  validationReport,
  rawData,
  processedData,
  qualityScore,
  trigger
}: ValidationReportDialogProps) {
  if (!validationReport && !rawData) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Eye className="h-4 w-4" />
      Voir le rapport de validation
    </Button>
  );

  const hasIssues = validationReport && (
    validationReport.droppedFields > 0 || 
    validationReport.noCitationFields.length > 0 || 
    validationReport.invalidEvidenceFields.length > 0
  );

  const renderFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    if (typeof value === 'object') {
      return <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span className="break-words">{String(value)}</span>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Rapport de Validation des Données
            {qualityScore && (
              <Badge variant={qualityScore >= 80 ? "default" : qualityScore >= 60 ? "secondary" : "destructive"}>
                Qualité: {qualityScore}%
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Détails sur la vérification des preuves et la validation des données extraites
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Résumé de validation */}
            {validationReport && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {hasIssues ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <h3 className="font-semibold">Résumé de la validation</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Champs conservés: {validationReport.keptFields}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Champs rejetés: {validationReport.droppedFields}</span>
                  </div>
                </div>

                {validationReport.noCitationFields.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Champs sans citations:</h4>
                    <div className="flex flex-wrap gap-2">
                      {validationReport.noCitationFields.map(field => (
                        <Badge key={field} variant="destructive">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {validationReport.invalidEvidenceFields.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-600 mb-2">Champs avec preuves invalides:</h4>
                    <div className="flex flex-wrap gap-2">
                      {validationReport.invalidEvidenceFields.map(field => (
                        <Badge key={field} variant="secondary">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Données brutes */}
            {rawData && (
              <div className="space-y-4">
                <h3 className="font-semibold">Données brutes extraites</h3>
                <div className="space-y-3">
                  {Object.entries(rawData)
                    .filter(([key]) => key !== 'citations' && key !== 'confidence')
                    .map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b">
                        <div className="font-medium">{key}</div>
                        <div className="col-span-2">
                          {renderFieldValue(key, value)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Données traitées */}
            {processedData && processedData !== rawData && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Données après validation</h3>
                  <div className="space-y-3">
                    {Object.entries(processedData)
                      .filter(([key]) => key !== 'citations' && key !== 'confidence')
                      .map(([key, value]) => {
                        const wasRejected = rawData?.[key] !== null && value === null;
                        return (
                          <div key={key} className={`grid grid-cols-3 gap-4 py-2 border-b ${wasRejected ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                            <div className="font-medium flex items-center gap-2">
                              {key}
                              {wasRejected && <XCircle className="h-3 w-3 text-red-500" />}
                            </div>
                            <div className="col-span-2">
                              {renderFieldValue(key, value)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* Citations si disponibles */}
            {rawData?.citations && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Citations et preuves</h3>
                  <div className="space-y-3">
                    {Object.entries(rawData.citations).map(([field, citations]: [string, any]) => (
                      <div key={field} className="border rounded p-3">
                        <h4 className="font-medium mb-2">{field}</h4>
                        {Array.isArray(citations) ? (
                          citations.map((citation, index) => (
                            <div key={index} className="text-sm bg-muted p-2 rounded mb-2">
                              <div><strong>Preuve:</strong> {citation.evidence || 'Non fournie'}</div>
                              {citation.page && <div><strong>Page:</strong> {citation.page}</div>}
                              {citation.confidence && <div><strong>Confiance:</strong> {citation.confidence}</div>}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">Aucune citation valide</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}