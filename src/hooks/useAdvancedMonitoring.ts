import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  apiLatency: number;
  errorRate: number;
  successRate: number;
  activeUsers: number;
  aiProcessingTime: number;
  databaseResponseTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface AlertThresholds {
  errorRateThreshold: number; // %
  latencyThreshold: number; // ms
  aiProcessingThreshold: number; // ms
  memoryThreshold: number; // MB
  successRateThreshold: number; // %
}

export const useAdvancedMonitoring = (thresholds?: Partial<AlertThresholds>) => {
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    apiLatency: 0,
    errorRate: 0,
    successRate: 100,
    activeUsers: 0,
    aiProcessingTime: 0,
    databaseResponseTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });

  const defaultThresholds: AlertThresholds = {
    errorRateThreshold: 5, // 5%
    latencyThreshold: 3000, // 3s
    aiProcessingThreshold: 30000, // 30s
    memoryThreshold: 100, // 100MB
    successRateThreshold: 95, // 95%
    ...thresholds
  };

  // Collecte des métriques système
  const collectSystemMetrics = useCallback(async (): Promise<SystemMetrics> => {
    try {
      const startTime = performance.now();

      // Test latence base de données
      const dbStart = performance.now();
      await supabase.from('organizations').select('count').limit(1);
      const databaseResponseTime = performance.now() - dbStart;

      // Métriques performance navigateur
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

      // Simulation d'autres métriques (à remplacer par vraies métriques)
      const newMetrics: SystemMetrics = {
        apiLatency: performance.now() - startTime,
        errorRate: Math.random() * 10, // Simulation
        successRate: 95 + Math.random() * 5,
        activeUsers: Math.floor(Math.random() * 100),
        aiProcessingTime: 5000 + Math.random() * 10000,
        databaseResponseTime,
        memoryUsage,
        cacheHitRate: 0.7 + Math.random() * 0.3
      };

      return newMetrics;
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      return metrics; // Retourner les métriques précédentes
    }
  }, [metrics]);

  // Création d'alertes basées sur les seuils
  const checkThresholdsAndCreateAlerts = useCallback((currentMetrics: SystemMetrics) => {
    const newAlerts: MonitoringAlert[] = [];

    // Vérification taux d'erreur
    if (currentMetrics.errorRate > defaultThresholds.errorRateThreshold) {
      newAlerts.push({
        id: `error-rate-${Date.now()}`,
        type: 'critical',
        title: 'Taux d\'erreur élevé',
        message: `Taux d'erreur: ${currentMetrics.errorRate.toFixed(1)}% (seuil: ${defaultThresholds.errorRateThreshold}%)`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { errorRate: currentMetrics.errorRate }
      });
    }

    // Vérification latence
    if (currentMetrics.apiLatency > defaultThresholds.latencyThreshold) {
      newAlerts.push({
        id: `latency-${Date.now()}`,
        type: 'warning',
        title: 'Latence API élevée',
        message: `Latence: ${currentMetrics.apiLatency.toFixed(0)}ms (seuil: ${defaultThresholds.latencyThreshold}ms)`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { latency: currentMetrics.apiLatency }
      });
    }

    // Vérification temps traitement IA
    if (currentMetrics.aiProcessingTime > defaultThresholds.aiProcessingThreshold) {
      newAlerts.push({
        id: `ai-processing-${Date.now()}`,
        type: 'warning',
        title: 'Traitement IA lent',
        message: `Temps IA: ${(currentMetrics.aiProcessingTime / 1000).toFixed(1)}s (seuil: ${defaultThresholds.aiProcessingThreshold / 1000}s)`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { aiProcessingTime: currentMetrics.aiProcessingTime }
      });
    }

    // Vérification utilisation mémoire
    if (currentMetrics.memoryUsage > defaultThresholds.memoryThreshold) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'warning',
        title: 'Utilisation mémoire élevée',
        message: `Mémoire: ${currentMetrics.memoryUsage.toFixed(1)}MB (seuil: ${defaultThresholds.memoryThreshold}MB)`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { memoryUsage: currentMetrics.memoryUsage }
      });
    }

    // Vérification taux de succès
    if (currentMetrics.successRate < defaultThresholds.successRateThreshold) {
      newAlerts.push({
        id: `success-rate-${Date.now()}`,
        type: 'critical',
        title: 'Taux de succès faible',
        message: `Succès: ${currentMetrics.successRate.toFixed(1)}% (seuil: ${defaultThresholds.successRateThreshold}%)`,
        timestamp: Date.now(),
        resolved: false,
        metadata: { successRate: currentMetrics.successRate }
      });
    }

    // Ajouter les nouvelles alertes
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      
      // Afficher toast pour alertes critiques
      newAlerts.forEach(alert => {
        if (alert.type === 'critical') {
          toast({
            variant: 'destructive',
            title: alert.title,
            description: alert.message,
          });
        }
      });
    }
  }, [defaultThresholds, toast]);

  // Monitoring en temps réel
  const startRealtimeMonitoring = useCallback((intervalMs = 30000) => {
    const interval = setInterval(async () => {
      const newMetrics = await collectSystemMetrics();
      setMetrics(newMetrics);
      checkThresholdsAndCreateAlerts(newMetrics);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [collectSystemMetrics, checkThresholdsAndCreateAlerts]);

  // Résoudre une alerte
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
  }, []);

  // Nettoyer les alertes anciennes
  const cleanupOldAlerts = useCallback((olderThanHours = 24) => {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    setAlerts(prev => 
      prev.filter(alert => alert.timestamp > cutoffTime || !alert.resolved)
    );
  }, []);

  // Analytics des erreurs
  const getErrorAnalytics = useCallback(async (timeRange = '24h') => {
    try {
      // Ici on pourrait interroger une table d'événements personnalisée
      // Pour maintenant, on simule les métriques d'erreur
      const mockErrorLogs = [
        { error_type: 'network_error', timestamp: Date.now() - 3600000 },
        { error_type: 'validation_error', timestamp: Date.now() - 7200000 },
        { error_type: 'ai_processing_error', timestamp: Date.now() - 1800000 }
      ];

      const errorsByType = mockErrorLogs.reduce((acc, log) => {
        acc[log.error_type] = (acc[log.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalErrors: mockErrorLogs.length,
        errorsByType,
        errorRate: (mockErrorLogs.length / Math.max(1, metrics.activeUsers)) * 100,
        topErrors: Object.entries(errorsByType)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching error analytics:', error);
      return null;
    }
  }, [metrics.activeUsers]);

  // Performance des fonctions Edge
  const getEdgeFunctionMetrics = useCallback(async () => {
    try {
      // Simuler métriques Edge Functions (à remplacer par vraie API Supabase)
      const functions = [
        'extract-product-data',
        'run-market-analysis', 
        'run-geographic-analysis',
        'run-lead-generation',
        'run-regulatory-analysis'
      ];

      const metrics = functions.map(name => ({
        name,
        invocations: Math.floor(Math.random() * 1000),
        averageLatency: Math.random() * 5000 + 1000,
        errorRate: Math.random() * 5,
        successRate: 95 + Math.random() * 5,
        cost: Math.random() * 10
      }));

      return metrics;
    } catch (error) {
      console.error('Error fetching edge function metrics:', error);
      return [];
    }
  }, []);

  // Initialisation du monitoring
  useEffect(() => {
    const cleanup = startRealtimeMonitoring();
    
    // Nettoyage périodique des alertes
    const cleanupInterval = setInterval(() => {
      cleanupOldAlerts();
    }, 60 * 60 * 1000); // Chaque heure

    return () => {
      cleanup();
      clearInterval(cleanupInterval);
    };
  }, [startRealtimeMonitoring, cleanupOldAlerts]);

  return {
    // État
    alerts: alerts.filter(a => !a.resolved),
    resolvedAlerts: alerts.filter(a => a.resolved),
    metrics,
    
    // Actions
    collectSystemMetrics,
    resolveAlert,
    cleanupOldAlerts,
    
    // Analytics
    getErrorAnalytics,
    getEdgeFunctionMetrics,
    
    // Configuration
    thresholds: defaultThresholds
  };
};

// Hook spécialisé pour le monitoring de production
export const useProductionMonitoring = () => {
  const monitoring = useAdvancedMonitoring({
    errorRateThreshold: 2, // Plus strict en prod
    latencyThreshold: 2000,
    aiProcessingThreshold: 20000,
    memoryThreshold: 150,
    successRateThreshold: 98
  });

  return {
    ...monitoring,
    
    // Dashboard de production
    getProductionDashboard: useCallback(async () => {
      const [errorAnalytics, edgeFunctionMetrics] = await Promise.all([
        monitoring.getErrorAnalytics(),
        monitoring.getEdgeFunctionMetrics()
      ]);

      return {
        systemHealth: monitoring.metrics,
        alerts: monitoring.alerts,
        errorAnalytics,
        edgeFunctionMetrics,
        timestamp: new Date().toISOString()
      };
    }, [monitoring])
  };
};