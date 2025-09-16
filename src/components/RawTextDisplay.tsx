import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Download, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface RawTextDisplayProps {
  rawText: string;
  extractionSource?: string;
  fileName?: string;
  className?: string;
  onDownload?: () => void;
  onNewExtraction?: () => void;
}

export function RawTextDisplay({ 
  rawText, 
  extractionSource, 
  fileName, 
  className,
  onDownload,
  onNewExtraction 
}: RawTextDisplayProps) {
  if (!rawText) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Analyse PDF Brute - Mode Strict 100% IA</CardTitle>
          <CardDescription>
            Aucune donnée extraite disponible
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Analyse PDF Brute - Mode Strict 100% IA</CardTitle>
            <CardDescription>
              Sortie directe de l'IA sans normalisation, trim() ni formatage
            </CardDescription>
            {fileName && (
              <p className="text-sm text-muted-foreground mt-1">
                Fichier analysé: {fileName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {extractionSource && (
              <Badge variant="outline" className="font-mono">
                {extractionSource}
              </Badge>
            )}
            <Badge variant="secondary">
              {rawText.length} caractères
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger Texte Brut
            </Button>
          )}
          {onNewExtraction && (
            <Button variant="outline" size="sm" onClick={onNewExtraction}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Nouvelle Analyse
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full rounded border">
          <pre className="p-4 text-sm whitespace-pre-wrap font-mono bg-muted/30">
            {rawText}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}