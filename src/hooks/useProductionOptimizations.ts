import React, { useCallback, useEffect, useMemo } from 'react';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';
import { useOptimizedQuery } from './useOptimizedQuery';
import { useErrorHandler } from './useErrorHandler';
import { useUserAnalytics } from './useUserAnalytics';
import { preloadAssets } from '@/utils/assetPreloader';

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableBundleAnalysis: boolean;
  enableMemoryOptimization: boolean;
  performanceThresholds: {
    maxRenderTime: number;
    maxMemoryUsage: number;
    maxApiResponseTime: number;
  };
}

interface OptimizationMetrics {
  bundleSize: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  lazyLoadingSavings: number;
}

export const useProductionOptimizations = (config?: Partial<OptimizationConfig>) => {
  const {
    enableLazyLoading = true,
    enableCaching = true,
    enableBundleAnalysis = true,
    enableMemoryOptimization = true,
    performanceThresholds = {
      maxRenderTime: 16, // 60fps
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxApiResponseTime: 2000 // 2s
    }
  } = config || {};

  const { measureRenderTime, measureMemoryUsage } = usePerformanceMonitoring({
    enableLogging: true,
    thresholds: {
      renderTime: performanceThresholds.maxRenderTime,
      memoryUsage: performanceThresholds.maxMemoryUsage,
      loadTime: performanceThresholds.maxApiResponseTime
    }
  });

  const { handleError } = useErrorHandler();
  const { trackPerformance } = useUserAnalytics();

  // Lazy Loading Optimization
  const createLazyComponent = useCallback(<T extends React.ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    if (!enableLazyLoading) {
      // Si lazy loading désactivé, charger immédiatement
      return componentImport().then(module => module.default);
    }

    return React.lazy(() => {
      const startTime = performance.now();
      
      return componentImport().then(module => {
        const loadTime = performance.now() - startTime;
        trackPerformance('lazy_component_load', loadTime);
        
        if (loadTime > 1000) {
          console.warn(`Slow lazy component load: ${loadTime}ms`);
        }
        
        return module;
      }).catch(error => {
        handleError(error, 'lazy_component_load');
        throw error;
      });
    });
  }, [enableLazyLoading, trackPerformance, handleError]);

  // Bundle Analysis
  const analyzeBundleSize = useCallback(async () => {
    if (!enableBundleAnalysis) return null;

    try {
      // Analyser la taille du bundle via Performance API
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const bundleEntries = entries.filter(entry => 
        entry.name.includes('.js') || entry.name.includes('.css')
      );

      const totalSize = bundleEntries.reduce((total, entry) => {
        return total + (entry.transferSize || 0);
      }, 0);

      const metrics = {
        totalBundleSize: totalSize,
        jsSize: bundleEntries.filter(e => e.name.includes('.js')).reduce((t, e) => t + (e.transferSize || 0), 0),
        cssSize: bundleEntries.filter(e => e.name.includes('.css')).reduce((t, e) => t + (e.transferSize || 0), 0),
        resourceCount: bundleEntries.length
      };

      // Alertes si bundle trop gros
      if (metrics.totalBundleSize > 1024 * 1024) { // > 1MB
        console.warn(`Large bundle size detected: ${(metrics.totalBundleSize / 1024 / 1024).toFixed(2)}MB`);
      }

      await trackPerformance('bundle_analysis', metrics.totalBundleSize);

      return metrics;
    } catch (error) {
      handleError(error as Error, 'bundle_analysis');
      return null;
    }
  }, [enableBundleAnalysis, trackPerformance, handleError]);

  // Memory Optimization
  const optimizeMemoryUsage = useCallback(() => {
    if (!enableMemoryOptimization) return;

    // Nettoyer les event listeners orphelins
    const cleanupEventListeners = () => {
      // Force garbage collection si disponible
      if ((window as any).gc) {
        (window as any).gc();
      }
    };

    // Cleanup au démontage
    return () => {
      cleanupEventListeners();
    };
  }, [enableMemoryOptimization]);

  // Cache Management
  const optimizeCaching = useCallback(() => {
    if (!enableCaching) return {};

    const cacheStats = {
      hits: 0,
      misses: 0,
      size: 0
    };

    // Intercepter les requêtes pour mesurer cache hit rate
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(input, init);
        const duration = performance.now() - startTime;
        
        // Vérifier si c'est un cache hit (réponse très rapide)
        if (duration < 50) {
          cacheStats.hits++;
        } else {
          cacheStats.misses++;
        }
        
        return response;
      } catch (error) {
        cacheStats.misses++;
        throw error;
      }
    };

    return {
      getCacheStats: () => ({
        ...cacheStats,
        hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
      })
    };
  }, [enableCaching]);

  // Performance Monitoring Integration
  const monitorPerformance = useCallback(async (): Promise<OptimizationMetrics> => {
    const bundleAnalysis = await analyzeBundleSize();
    measureMemoryUsage();

    return {
      bundleSize: bundleAnalysis?.totalBundleSize || 0,
      renderTime: 0, // À mesurer par composant
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      cacheHitRate: 0, // À calculer via cache stats
      lazyLoadingSavings: 0 // À estimer
    };
  }, [analyzeBundleSize, measureMemoryUsage]);

  // Critical Resource Preloading
  const preloadCriticalResources = useCallback((resources: string[]) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Set correct 'as' attribute based on resource type
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(woff2?|ttf|otf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (resource.match(/\.(jpe?g|png|webp|avif)$/)) {
        link.as = 'image';
      } else {
        // Si on ne peut pas déterminer le type, ne pas ajouter de preload
        console.warn(`Cannot determine preload type for resource: ${resource}`);
        return;
      }
      
      document.head.appendChild(link);
    });
  }, []);

  // Optimized Image Loading
  const createOptimizedImageLoader = useCallback(() => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { threshold: 0.1 });

    return {
      observeImage: (img: HTMLImageElement) => imageObserver.observe(img),
      disconnect: () => imageObserver.disconnect()
    };
  }, []);

  // Effect pour initialiser les optimizations
  useEffect(() => {
    const cleanup = optimizeMemoryUsage();
    const cacheManager = optimizeCaching();

    // Preload critical assets silently (no console errors)
    preloadAssets([
      '/assets/wine-hero.jpg', // Use correct Vite asset path
    ]);

    return () => {
      if (cleanup) cleanup();
    };
  }, [optimizeMemoryUsage, optimizeCaching]);

  return {
    // Lazy Loading
    createLazyComponent,
    
    // Bundle Analysis
    analyzeBundleSize,
    
    // Performance Monitoring
    monitorPerformance,
    measureRenderTime,
    measureMemoryUsage,
    
    // Image Optimization
    createOptimizedImageLoader,
    
    // Resource Preloading
    preloadCriticalResources,
    
    // Error Handling
    handleError
  };
};

// Hook spécialisé pour les composants lourds
export const useHeavyComponentOptimization = (componentName: string) => {
  const { measureRenderTime, handleError } = useProductionOptimizations();

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      try {
        measureRenderTime(componentName, startTime);
      } catch (error) {
        handleError(error as Error, `component_render_${componentName}`);
      }
    };
  }, [componentName, measureRenderTime, handleError]);
};