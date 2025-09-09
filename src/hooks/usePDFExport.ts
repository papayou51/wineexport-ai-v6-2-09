import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PDFExportParams {
  projectId: string;
  countryCode: string;
  analyses: any[];
  projectName: string;
}

export const usePDFExport = () => {
  return useMutation({
    mutationFn: async ({ projectId, countryCode, analyses, projectName }: PDFExportParams) => {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { 
          projectId, 
          countryCode, 
          analyses,
          projectName,
          format: 'professional'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Create download link for the professional HTML report
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || 'WineExport-Analysis-Report.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export réussi",
        description: `Le rapport professionnel ${data.fileName} a été téléchargé. Utilisez Ctrl+P pour l'imprimer en PDF.`,
      });
    },
    onError: (error) => {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le rapport PDF.",
        variant: "destructive",
      });
    },
  });
};