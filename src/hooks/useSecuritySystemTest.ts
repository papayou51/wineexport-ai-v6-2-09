import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SecuritySystemStatus {
  geographicRules: boolean;
  trustedDevices: boolean;
  securityIncidents: boolean;
  intelligentSecurity: boolean;
  errors: string[];
}

export const useSecuritySystemTest = () => {
  const [status, setStatus] = useState<SecuritySystemStatus>({
    geographicRules: false,
    trustedDevices: false,
    securityIncidents: false,
    intelligentSecurity: false,
    errors: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const testSystem = async () => {
    if (!user) return;

    setLoading(true);
    const errors: string[] = [];
    const testStatus = {
      geographicRules: false,
      trustedDevices: false,
      securityIncidents: false,
      intelligentSecurity: false,
      errors: []
    };

    try {
      // Test geographic rules table access
      const { error: geoError } = await supabase
        .from('geographic_security_rules')
        .select('count', { count: 'exact' });
      
      testStatus.geographicRules = !geoError;
      if (geoError) errors.push(`Geographic rules: ${geoError.message}`);

      // Test trusted devices table access
      const { error: deviceError } = await supabase
        .from('trusted_devices')
        .select('count', { count: 'exact' });
      
      testStatus.trustedDevices = !deviceError;
      if (deviceError) errors.push(`Trusted devices: ${deviceError.message}`);

      // Test security incidents table access
      const { error: incidentError } = await supabase
        .from('security_incidents')
        .select('count', { count: 'exact' });
      
      testStatus.securityIncidents = !incidentError;
      if (incidentError) errors.push(`Security incidents: ${incidentError.message}`);

      // Test intelligent security function
      try {
        // Get user's organization ID
        const { data: orgData } = await supabase
          .from('user_organization_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        const { error: functionError } = await supabase.functions.invoke('intelligent-security', {
          body: {
            user_id: user.id,
            organization_id: orgData?.organization_id || '',
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
            country: 'FR',
            city: 'Paris',
            device_fingerprint: navigator.userAgent,
            session_token: 'test-session'
          }
        });
        
        testStatus.intelligentSecurity = !functionError;
        if (functionError) errors.push(`Intelligent security: ${functionError.message}`);
      } catch (err) {
        errors.push(`Intelligent security: Function not available`);
      }

    } catch (error) {
      errors.push(`System test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setStatus({ ...testStatus, errors });
    setLoading(false);
  };

  useEffect(() => {
    testSystem();
  }, [user]);

  return {
    status,
    loading,
    retestSystem: testSystem
  };
};