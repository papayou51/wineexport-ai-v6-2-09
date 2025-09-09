import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/components/ui/notification-center";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const STORAGE_KEY = "wineexport_notifications";
const MAX_NOTIFICATIONS = 50;

export const useNotifications = (): UseNotificationsReturn => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Charger les notifications depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reconvertir les dates string en objets Date
        const withDates = parsed.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp),
        }));
        setNotifications(withDates);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  }, []);

  // Sauvegarder les notifications dans localStorage
  const saveNotifications = useCallback((notifs: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notifications:", error);
    }
  }, []);

  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  // Ajouter une nouvelle notification
  const addNotification = useCallback((
    notificationData: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    const newNotification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notificationData,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(updated);
      return updated;
    });

    // Afficher aussi un toast pour les notifications importantes
    if (notificationData.type === "error" || notificationData.type === "success") {
      toast({
        title: notificationData.title,
        description: notificationData.message,
        variant: notificationData.type === "error" ? "destructive" : "default",
      });
    }
  }, [toast, saveNotifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Effacer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  // Supprimer une notification spécifique
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
  };
};

// Hook pour les notifications spécifiques aux analyses
export const useAnalysisNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyAnalysisStarted = useCallback((analysisName: string, projectName: string) => {
    addNotification({
      type: "info",
      title: "Analyse démarrée",
      message: `L'analyse "${analysisName}" du projet "${projectName}" a commencé.`,
    });
  }, [addNotification]);

  const notifyAnalysisCompleted = useCallback((
    analysisName: string, 
    projectName: string,
    analysisId: string
  ) => {
    addNotification({
      type: "success",
      title: "Analyse terminée",
      message: `L'analyse "${analysisName}" du projet "${projectName}" est terminée.`,
      action: {
        label: "Voir le rapport",
        onClick: () => window.location.href = `/analysis/${analysisId}`,
      },
    });
  }, [addNotification]);

  const notifyAnalysisError = useCallback((
    analysisName: string, 
    projectName: string,
    error: string
  ) => {
    addNotification({
      type: "error",
      title: "Erreur d'analyse",
      message: `L'analyse "${analysisName}" du projet "${projectName}" a échoué: ${error}`,
      action: {
        label: "Réessayer",
        onClick: () => {
          // Ici on pourrait implémenter la logique de retry
          console.log("Retry analysis");
        },
      },
    });
  }, [addNotification]);

  return {
    notifyAnalysisStarted,
    notifyAnalysisCompleted,
    notifyAnalysisError,
  };
};

// Hook pour les notifications spécifiques aux projets
export const useProjectNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyProjectCreated = useCallback((projectName: string) => {
    addNotification({
      type: "success",
      title: "Projet créé",
      message: `Le projet "${projectName}" a été créé avec succès.`,
    });
  }, [addNotification]);

  const notifyProjectUpdated = useCallback((projectName: string) => {
    addNotification({
      type: "info",
      title: "Projet mis à jour",
      message: `Le projet "${projectName}" a été mis à jour.`,
    });
  }, [addNotification]);

  const notifyProjectDeleted = useCallback((projectName: string) => {
    addNotification({
      type: "info",
      title: "Projet supprimé",
      message: `Le projet "${projectName}" a été supprimé.`,
    });
  }, [addNotification]);

  return {
    notifyProjectCreated,
    notifyProjectUpdated,
    notifyProjectDeleted,
  };
};