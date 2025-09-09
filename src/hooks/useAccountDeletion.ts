import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSecurityNotifications } from '@/hooks/useSecurityNotifications';

interface UseAccountDeletionReturn {
  isRequesting: boolean;
  isConfirming: boolean;
  requestDeletion: () => Promise<void>;
  confirmDeletion: (token: string) => Promise<void>;
}

export const useAccountDeletion = (): UseAccountDeletionReturn => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { triggerAccountDeletionNotification } = useSecurityNotifications();

  const requestDeletion = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'request' }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email de confirmation envoyé",
        description: "Vérifiez votre boîte email pour confirmer la suppression de votre compte. Le lien expire dans 24 heures.",
      });

      // Déclencher notification de sécurité
      await triggerAccountDeletionNotification();

    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de confirmation. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const confirmDeletion = async (token: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { 
          action: 'confirm',
          confirmationToken: token
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés définitivement.",
      });

      // Sign out and redirect
      await signOut();
      navigate('/');

    } catch (error: any) {
      console.error('Error confirming account deletion:', error);
      
      let errorMessage = "Impossible de supprimer le compte. Veuillez réessayer.";
      if (error.message?.includes('Token invalide')) {
        errorMessage = "Lien de confirmation invalide ou déjà utilisé.";
      } else if (error.message?.includes('Token expiré')) {
        errorMessage = "Lien de confirmation expiré. Veuillez refaire une demande.";
      }

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    isRequesting,
    isConfirming,
    requestDeletion,
    confirmDeletion,
  };
};