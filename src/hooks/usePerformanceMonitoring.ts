import { useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface PerformanceConfig {
  enableLogging?: boolean;
  enableToasts?: boolean;
  thresholds?: {
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
  };
}

export const usePerformanceMonitoring = (config: PerformanceConfig = {}) => {
  const { toast } = useToast();
  const {
    enableLogging = true,
    enableToasts = false,
    thresholds = {
      loadTime: 3000,
      renderTime: 16,
      memoryUsage: 50 * 1024 * 1024 // 50MB
    }
  } = config;

  // Throttle logging to prevent spam
  const loggedMetrics = new Set<string>();
  const THROTTLE_INTERVAL = 5000; // 5 seconds

  const logMetric = useCallback((metric: PerformanceMetric) => {
    const metricKey = `${metric.name}-${Math.floor(metric.timestamp / THROTTLE_INTERVAL)}`;
    
    // Skip if we already logged this type of metric recently
    if (loggedMetrics.has(metricKey)) {
      return;
    }
    
    loggedMetrics.add(metricKey);
    
    // Clean up old entries to prevent memory leaks
    if (loggedMetrics.size > 100) {
      const oldEntries = Array.from(loggedMetrics).slice(0, 50);
      oldEntries.forEach(entry => loggedMetrics.delete(entry));
    }

    if (enableLogging && metric.name !== 'Page Load Time') {
      // Only log non-repetitive metrics or critical ones
      console.log(`[Performance] ${metric.name}: ${metric.value}ms`, {
        timestamp: new Date(metric.timestamp).toISOString(),
        metric
      });
    }

    // Check thresholds and show toast if needed
    if (enableToasts) {
      if (metric.name === 'Page Load Time' && metric.value > thresholds.loadTime!) {
        toast({
          variant: "destructive",
          title: "Performance Warning",
          description: `Page load took ${(metric.value / 1000).toFixed(1)}s`,
        });
      }
    }
  }, [enableLogging, enableToasts, thresholds, toast]);

  const measurePageLoad = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        logMetric({
          name: 'Page Load Time',
          value: loadTime,
          timestamp: Date.now()
        });
      }
    }
  }, [logMetric]);

  const measureRenderTime = useCallback((componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    logMetric({
      name: `${componentName} Render Time`,
      value: renderTime,
      timestamp: Date.now()
    });

    if (renderTime > thresholds.renderTime!) {
      console.warn(`[Performance] Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    return renderTime;
  }, [logMetric, thresholds.renderTime]);

  const measureMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      logMetric({
        name: 'Memory Usage',
        value: memory.usedJSHeapSize,
        timestamp: Date.now()
      });

      if (memory.usedJSHeapSize > thresholds.memoryUsage!) {
        console.warn(`[Performance] High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }, [logMetric, thresholds.memoryUsage]);

  const measureApiCall = useCallback((apiName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logMetric({
      name: `API Call: ${apiName}`,
      value: duration,
      timestamp: Date.now()
    });

    return duration;
  }, [logMetric]);

  useEffect(() => {
    // Measure initial page load
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, [measurePageLoad]);

  return {
    measureRenderTime,
    measureMemoryUsage,
    measureApiCall,
    logMetric
  };
};

// Hook for component-specific performance tracking
export const useComponentPerformance = (componentName: string) => {
  const { measureRenderTime } = usePerformanceMonitoring();

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      measureRenderTime(componentName, startTime);
    };
  }, [componentName, measureRenderTime]);
};