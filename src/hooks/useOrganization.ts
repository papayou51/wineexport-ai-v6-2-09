import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
    } else {
      setOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserOrganization = async () => {
    try {
      setLoading(true);
      
      // Get user's organization roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_organization_roles')
        .select('organization_id, role')
        .eq('user_id', user?.id)
        .single();

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }

      if (userRoles) {
        // Get organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userRoles.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
          return;
        }

        setOrganization(orgData);
      }
    } catch (error) {
      console.error('Error in fetchUserOrganization:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour de l\'organisation');
        throw error;
      }

      setOrganization({ ...organization, ...updates });
      toast.success('Organisation mise à jour avec succès');
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  };

  return {
    organization,
    loading,
    updateOrganization,
    refetch: fetchUserOrganization,
  };
};