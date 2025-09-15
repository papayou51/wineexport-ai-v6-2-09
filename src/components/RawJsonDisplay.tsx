import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface RawJsonDisplayProps {
  rawData?: any;
  qualityScore?: number;
  extractionSource?: string;
  className?: string;
}

export function RawJsonDisplay({ rawData, qualityScore, extractionSource, className }: RawJsonDisplayProps) {
  if (!rawData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">JSON Brut - Mode Strict 100% IA</CardTitle>
          <CardDescription>
            Aucune donnée extraite disponible
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Separate citations and confidence from main data
  const { citations, confidence, ...mainData } = rawData;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">JSON Brut - Mode Strict 100% IA</CardTitle>
            <CardDescription>
              Extraction directe sans normalisation ni fallback
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {extractionSource && (
              <Badge variant="outline" className="font-mono">
                {extractionSource}
              </Badge>
            )}
            {typeof qualityScore === 'number' && (
              <Badge variant={qualityScore >= 70 ? 'default' : qualityScore >= 50 ? 'secondary' : 'destructive'}>
                {qualityScore}% qualité
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main extracted data */}
        <div>
          <h4 className="font-semibold mb-2">Données Extraites</h4>
          <ScrollArea className="h-64 w-full rounded border">
            <pre className="p-4 text-sm">
              {JSON.stringify(mainData, null, 2)}
            </pre>
          </ScrollArea>
        </div>

        {/* Citations */}
        {citations && Object.keys(citations).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Citations (Preuves)</h4>
              <ScrollArea className="h-32 w-full rounded border">
                <div className="p-4 space-y-2">
                  {Object.entries(citations).map(([field, fieldCitations]: [string, any]) => (
                    <div key={field} className="text-sm">
                      <span className="font-medium text-primary">{field}:</span>
                      {Array.isArray(fieldCitations) && fieldCitations.map((citation: any, idx: number) => (
                        <div key={idx} className="ml-4 text-muted-foreground">
                          <span className="text-xs">Page {citation.page}:</span> "{citation.evidence}"
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Confidence scores */}
        {confidence && Object.keys(confidence).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Scores de Confiance</h4>
              <ScrollArea className="h-24 w-full rounded border">
                <pre className="p-4 text-sm">
                  {JSON.stringify(confidence, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}