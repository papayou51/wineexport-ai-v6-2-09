import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  project_id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  country_code: string;
  business_focus?: string[];
  annual_volume?: number;
  current_suppliers?: string[];
  price_range?: string;
  qualification_score?: number;
  contact_status: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useProjectLeads = (projectId: string) => {
  return useQuery({
    queryKey: ['leads', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('qualification_score', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!projectId,
  });
};

export const useLeadsByCountry = (projectId: string, countryCode: string) => {
  return useQuery({
    queryKey: ['leads', projectId, countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .eq('country_code', countryCode)
        .order('qualification_score', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!projectId && !!countryCode,
  });
};