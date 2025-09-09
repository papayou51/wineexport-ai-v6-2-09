import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from './useNotifications';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to analyses table changes
    const analysesChannel = supabase
      .channel('analyses-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyses',
          filter: `project_id=in.(select id from projects where user_id=eq.${user.id})`
        },
        (payload) => {
          console.log('Analysis updated:', payload);
          
          if (payload.new && payload.old) {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            // Check if analysis just completed (status changed to completed)
            if (oldData.status !== 'completed' && newData.status === 'completed') {
              addNotification({
                type: 'success',
                title: 'Analyse terminée',
                message: `L'analyse ${newData.analysis_type} est maintenant disponible`,
                action: {
                  label: 'Voir le rapport',
                  onClick: () => window.location.href = `/analysis-report/${newData.id}`
                }
              });
            }
            
            // Check if analysis failed
            if (oldData.status !== 'error' && newData.status === 'error') {
              addNotification({
                type: 'error',
                title: 'Échec de l\'analyse',
                message: `L'analyse ${newData.analysis_type} a échoué. Veuillez réessayer.`,
                action: {
                  label: 'Réessayer',
                  onClick: () => window.location.href = `/projects/${newData.project_id}`
                }
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to projects table changes
    const projectsChannel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New project created:', payload);
          
          if (payload.new) {
            const project = payload.new as any;
            addNotification({
              type: 'info',
              title: 'Nouveau projet créé',
              message: `Le projet "${project.name}" a été créé avec succès`,
              action: {
                label: 'Voir le projet',
                onClick: () => window.location.href = `/projects/${project.id}`
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(analysesChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, [user?.id, addNotification]);
};