import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SecurityIncident {
  id: string;
  organization_id: string;
  user_id?: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  country?: string;
  city?: string;
  device_info?: any;
  details: any;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export const useSecurityIncidents = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchIncidents();
    }
  }, [user]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limiter à 100 incidents récents

      if (error) {
        console.error('Error fetching security incidents:', error);
        return;
      }

      setIncidents((data || []) as SecurityIncident[]);
    } catch (error) {
      console.error('Error in fetchIncidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIncident = async (incidentId: string, updates: Partial<SecurityIncident>) => {
    const updateData = {
      ...updates,
      ...(updates.status && updates.status !== 'open' ? {
        resolved_by: user?.id,
        resolved_at: new Date().toISOString()
      } : {})
    };

    const { data, error } = await supabase
      .from('security_incidents')
      .update(updateData)
      .eq('id', incidentId)
      .select()
      .single();

    if (error) throw error;

    setIncidents(prev => prev.map(incident => 
      incident.id === incidentId ? { ...incident, ...data } as SecurityIncident : incident
    ));
    
    return data;
  };

  const createIncident = async (incidentData: Omit<SecurityIncident, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('security_incidents')
      .insert(incidentData)
      .select()
      .single();

    if (error) throw error;

    setIncidents(prev => [data as SecurityIncident, ...prev]);
    return data;
  };

  const getIncidentStats = () => {
    const open = incidents.filter(i => i.status === 'open').length;
    const critical = incidents.filter(i => i.severity === 'critical').length;
    const recent = incidents.filter(i => 
      new Date(i.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return { open, critical, recent, total: incidents.length };
  };

  return {
    incidents,
    loading,
    updateIncident,
    createIncident,
    getIncidentStats,
    refetch: fetchIncidents
  };
};