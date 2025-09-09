import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TrustedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name?: string;
  device_type?: string;
  os_details?: string;
  browser?: string;
  screen_resolution?: string;
  timezone?: string;
  first_seen: string;
  last_seen: string;
  trust_score: number;
  is_trusted: boolean;
  metadata?: any;
}

export const useTrustedDevices = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error fetching trusted devices:', error);
        return;
      }

      setDevices(data || []);
    } catch (error) {
      console.error('Error in fetchDevices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<TrustedDevice>) => {
    const { data, error } = await supabase
      .from('trusted_devices')
      .update(updates)
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;

    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, ...data } : device
    ));
    
    return data;
  };

  const deleteDevice = async (deviceId: string) => {
    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;

    setDevices(prev => prev.filter(device => device.id !== deviceId));
  };

  const trustDevice = async (deviceId: string) => {
    return updateDevice(deviceId, { 
      is_trusted: true, 
      trust_score: Math.min((devices.find(d => d.id === deviceId)?.trust_score || 0) + 20, 100)
    });
  };

  const untrustDevice = async (deviceId: string) => {
    return updateDevice(deviceId, { 
      is_trusted: false, 
      trust_score: Math.max((devices.find(d => d.id === deviceId)?.trust_score || 0) - 30, 0)
    });
  };

  return {
    devices,
    loading,
    updateDevice,
    deleteDevice,
    trustDevice,
    untrustDevice,
    refetch: fetchDevices
  };
};