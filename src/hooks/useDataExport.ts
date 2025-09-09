import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ExportFormat = 'json' | 'csv';

interface UseDataExportReturn {
  isExporting: boolean;
  exportData: (format?: ExportFormat) => Promise<void>;
}

export const useDataExport = (): UseDataExportReturn => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (format: ExportFormat = 'json') => {
    setIsExporting(true);
    try {
      console.log(`Starting data export in ${format} format...`);

      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { format },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        throw error;
      }

      // Create and download the file
      let blob: Blob;
      let filename: string;

      if (format === 'csv') {
        blob = new Blob([data], { type: 'text/csv' });
        filename = `user-data-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        format === 'csv' 
          ? 'Données exportées en CSV avec succès !' 
          : 'Données exportées en JSON avec succès !'
      );

    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error(
        error.message || 'Erreur lors de l\'export des données. Veuillez réessayer.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportData,
  };
};