import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_type?: string;
  browser?: string;
  ip_address?: string | null;
  location?: any;
  is_current: boolean;
  last_active: string;
  created_at: string;
  // Nouvelles colonnes enrichies
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  os_details?: string;
  screen_resolution?: string;
  is_suspicious?: boolean;
  risk_score?: number;
  connection_type?: string;
  previous_ips?: string[];
}

export const useSessions = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSessions();
      // Mettre à jour la session courante
      updateCurrentSession();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [user, session]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des sessions:', error);
        return;
      }

      setSessions(data as UserSession[] || []);
    } catch (error) {
      console.error('Erreur dans fetchSessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentSession = async () => {
    if (!user || !session) return;

    try {
      // Obtenir des informations sur le navigateur et l'appareil
      const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
      const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                    navigator.userAgent.includes('Firefox') ? 'Firefox' :
                    navigator.userAgent.includes('Safari') ? 'Safari' : 'Autre';

      // Obtenir la résolution d'écran
      const screenResolution = `${screen.width}x${screen.height}`;

      // D'abord faire un upsert basique de la session
      const { error: upsertError } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          session_token: session.access_token,
          device_type: deviceType,
          browser: browser,
          is_current: true,
          screen_resolution: screenResolution,
          last_active: new Date().toISOString(),
        }, {
          onConflict: 'session_token'
        });

      if (upsertError) {
        console.error('Erreur lors de la mise à jour de la session:', upsertError);
        return;
      }

      // Ensuite enrichir la session avec les données de géolocalisation
      try {
        const { error: enrichError } = await supabase.functions.invoke('session-tracker', {
          body: {
            user_agent: navigator.userAgent,
            session_token: session.access_token,
            user_id: user.id
          }
        });

        if (enrichError) {
          console.warn('Erreur lors de l\'enrichissement de la session:', enrichError);
          // Ne pas bloquer l'application si l'enrichissement échoue
        }
      } catch (enrichError) {
        console.warn('Erreur lors de l\'appel à session-tracker:', enrichError);
      }

      // Recharger les sessions après enrichissement
      setTimeout(() => fetchSessions(), 2000);

    } catch (error) {
      console.error('Erreur dans updateCurrentSession:', error);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        toast.error('Erreur lors de la suppression de la session');
        throw error;
      }

      // Mise à jour locale
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session fermée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error);
      throw error;
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!user || !session) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('session_token', session.access_token);

      if (error) {
        toast.error('Erreur lors de la suppression des sessions');
        throw error;
      }

      // Mise à jour locale
      setSessions(prev => prev.filter(s => s.session_token === session.access_token));
      toast.success('Toutes les autres sessions ont été fermées');
    } catch (error) {
      console.error('Erreur lors de la suppression des sessions:', error);
      throw error;
    }
  };

  return {
    sessions,
    loading,
    terminateSession,
    terminateAllOtherSessions,
    refetch: fetchSessions,
  };
};