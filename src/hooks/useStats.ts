import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get projects count
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Get analyses count
      const { count: analysesCount } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true });

      // Get leads count
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Get unique target countries
      const { data: projects } = await supabase
        .from('projects')
        .select('target_countries');

      const uniqueCountries = new Set();
      projects?.forEach(project => {
        project.target_countries?.forEach(country => uniqueCountries.add(country));
      });

      return {
        products: productsCount || 0,
        projects: projectsCount || 0,
        analyses: analysesCount || 0,
        leads: leadsCount || 0,
        countries: uniqueCountries.size
      };
    },
  });
};