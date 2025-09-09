import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityNotificationMetadata {
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  timestamp?: string;
  activityType?: string;
}

export type SecurityNotificationType = 
  | 'login_new_location' 
  | 'password_change' 
  | 'email_change' 
  | '2fa_enabled' 
  | '2fa_disabled' 
  | 'account_deletion_requested' 
  | 'suspicious_activity';

interface SecurityNotificationPreferences {
  loginNotifications: boolean;
  passwordChangeNotifications: boolean;
  emailChangeNotifications: boolean;
  twoFactorNotifications: boolean;
  accountDeletionNotifications: boolean;
  suspiciousActivityNotifications: boolean;
}

interface UseSecurityNotificationsReturn {
  isLoading: boolean;
  preferences: SecurityNotificationPreferences;
  updatePreferences: (newPreferences: Partial<SecurityNotificationPreferences>) => Promise<void>;
  sendSecurityNotification: (
    type: SecurityNotificationType, 
    metadata?: SecurityNotificationMetadata
  ) => Promise<void>;
  triggerLoginNotification: (location?: string, ipAddress?: string) => Promise<void>;
  triggerPasswordChangeNotification: () => Promise<void>;
  triggerEmailChangeNotification: () => Promise<void>;
  trigger2FANotification: (enabled: boolean) => Promise<void>;
  triggerAccountDeletionNotification: () => Promise<void>;
  triggerSuspiciousActivityNotification: (activityType: string, metadata?: SecurityNotificationMetadata) => Promise<void>;
}

export const useSecurityNotifications = (): UseSecurityNotificationsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<SecurityNotificationPreferences>({
    loginNotifications: true,
    passwordChangeNotifications: true,
    emailChangeNotifications: true,
    twoFactorNotifications: true,
    accountDeletionNotifications: true,
    suspiciousActivityNotifications: true,
  });

  const getDeviceInfo = useCallback(() => {
    const userAgent = navigator.userAgent;
    let device = "Ordinateur";
    let browser = "Navigateur inconnu";

    // Détection de l'appareil
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      device = /iPad/.test(userAgent) ? "iPad" : "Mobile";
    }

    // Détection du navigateur
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    return { device, browser };
  }, []);

  const sendSecurityNotification = useCallback(async (
    type: SecurityNotificationType,
    metadata: SecurityNotificationMetadata = {}
  ) => {
    if (!user?.email) {
      console.warn("No user email available for security notification");
      return;
    }

    try {
      const { device, browser } = getDeviceInfo();
      
      const enrichedMetadata = {
        ...metadata,
        device: metadata.device || device,
        browser: metadata.browser || browser,
        timestamp: metadata.timestamp || new Date().toLocaleString('fr-FR'),
      };

      const { error } = await supabase.functions.invoke('security-notifications', {
        body: {
          userEmail: user.email,
          notificationType: type,
          metadata: enrichedMetadata,
        },
      });

      if (error) throw error;

      console.log(`Security notification sent: ${type}`);
    } catch (error) {
      console.error('Error sending security notification:', error);
      toast({
        variant: "destructive",
        title: "Erreur de notification",
        description: "Impossible d'envoyer la notification de sécurité",
      });
    }
  }, [user?.email, getDeviceInfo, toast]);

  const updatePreferences = useCallback(async (newPreferences: Partial<SecurityNotificationPreferences>) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Pour l'instant, on stocke les préférences localement
      // Dans une version future, on pourrait les sauvegarder en base de données
      setPreferences(prev => ({ ...prev, ...newPreferences }));

      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences de notifications de sécurité ont été sauvegardées",
      });
    } catch (error) {
      console.error('Error updating security preferences:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  const triggerLoginNotification = useCallback(async (location?: string, ipAddress?: string) => {
    if (!preferences.loginNotifications) return;
    
    await sendSecurityNotification('login_new_location', {
      location,
      ipAddress,
    });
  }, [preferences.loginNotifications, sendSecurityNotification]);

  const triggerPasswordChangeNotification = useCallback(async () => {
    if (!preferences.passwordChangeNotifications) return;
    
    await sendSecurityNotification('password_change');
  }, [preferences.passwordChangeNotifications, sendSecurityNotification]);

  const triggerEmailChangeNotification = useCallback(async () => {
    if (!preferences.emailChangeNotifications) return;
    
    await sendSecurityNotification('email_change');
  }, [preferences.emailChangeNotifications, sendSecurityNotification]);

  const trigger2FANotification = useCallback(async (enabled: boolean) => {
    if (!preferences.twoFactorNotifications) return;
    
    await sendSecurityNotification(enabled ? '2fa_enabled' : '2fa_disabled');
  }, [preferences.twoFactorNotifications, sendSecurityNotification]);

  const triggerAccountDeletionNotification = useCallback(async () => {
    if (!preferences.accountDeletionNotifications) return;
    
    await sendSecurityNotification('account_deletion_requested');
  }, [preferences.accountDeletionNotifications, sendSecurityNotification]);

  const triggerSuspiciousActivityNotification = useCallback(async (
    activityType: string, 
    metadata: SecurityNotificationMetadata = {}
  ) => {
    if (!preferences.suspiciousActivityNotifications) return;
    
    await sendSecurityNotification('suspicious_activity', {
      ...metadata,
      activityType,
    });
  }, [preferences.suspiciousActivityNotifications, sendSecurityNotification]);

  return {
    isLoading,
    preferences,
    updatePreferences,
    sendSecurityNotification,
    triggerLoginNotification,
    triggerPasswordChangeNotification,
    triggerEmailChangeNotification,
    trigger2FANotification,
    triggerAccountDeletionNotification,
    triggerSuspiciousActivityNotification,
  };
};