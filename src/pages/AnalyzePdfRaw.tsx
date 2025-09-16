import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AnalyzePdfRaw() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleAnalyze() {
    if (!file) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(
        `https://gbuyfwlhxfwecitjtxii.supabase.co/functions/v1/analyze-pdf-raw`,
        { 
          method: "POST", 
          body: formData 
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const rawText = await response.text();
      setResult(rawText);
      
      toast({
        title: "Analyse terminée",
        description: "Le PDF a été analysé avec succès",
      });
      
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Analyse IA d'un PDF (BRUT)</h1>
        <p className="text-muted-foreground">
          Analyse directe par IA sans traitement - sortie texte brut
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sélectionner un PDF
          </CardTitle>
          <CardDescription>
            Choisissez un fichier PDF pour l'analyser directement avec l'IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : "Cliquez pour sélectionner un PDF"}
                </p>
                {file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(file.size / 1024)} KB
                  </p>
                )}
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              "Lancer l'analyse"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Résultat de l'analyse (texte brut)</CardTitle>
            <CardDescription>
              Sortie directe de l'IA sans modification ni formatage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap border border-border rounded-md p-4 bg-muted/50 font-mono text-sm overflow-auto max-h-96">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}