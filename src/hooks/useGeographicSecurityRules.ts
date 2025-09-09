import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GeographicSecurityRule {
  id: string;
  organization_id: string;
  rule_type: 'allow_country' | 'block_country' | 'allow_region' | 'block_region' | 'geofence';
  rule_value: string;
  is_active: boolean;
  priority: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const useGeographicSecurityRules = () => {
  const [rules, setRules] = useState<GeographicSecurityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRules();
    }
  }, [user]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('geographic_security_rules')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching geographic rules:', error);
        return;
      }

      setRules((data || []) as GeographicSecurityRule[]);
    } catch (error) {
      console.error('Error in fetchRules:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData: {
    rule_type: GeographicSecurityRule['rule_type'];
    rule_value: string;
    priority: number;
    is_active: boolean;
    metadata?: any;
  }) => {
    if (!user) throw new Error('User not authenticated');

    // Obtenir l'organisation de l'utilisateur
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organization_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orgError || !userOrgs) {
      throw new Error('Organization not found');
    }

    const { data, error } = await supabase
      .from('geographic_security_rules')
      .insert({
        organization_id: userOrgs.organization_id,
        created_by: user.id,
        ...ruleData
      })
      .select()
      .single();

    if (error) throw error;

    setRules(prev => [data as GeographicSecurityRule, ...prev]);
    return data;
  };

  const updateRule = async (ruleId: string, updates: Partial<GeographicSecurityRule>) => {
    const { data, error } = await supabase
      .from('geographic_security_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;

    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...data } as GeographicSecurityRule : rule
    ));
    
    return data;
  };

  const deleteRule = async (ruleId: string) => {
    const { error } = await supabase
      .from('geographic_security_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;

    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refetch: fetchRules
  };
};