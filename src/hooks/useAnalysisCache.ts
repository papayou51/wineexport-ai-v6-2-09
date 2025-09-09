import { useState, useEffect } from 'react';
import { Analysis } from '@/hooks/useAnalyses';

interface CacheEntry {
  data: Analysis;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

const CACHE_KEY_PREFIX = 'wineexport_analysis_cache_';
const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
const DEFAULT_MAX_SIZE = 100;

export const useAnalysisCache = (options: CacheOptions = {}) => {
  const { ttl = DEFAULT_TTL, maxSize = DEFAULT_MAX_SIZE } = options;
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0,
  });

  const getCacheKey = (projectId: string, analysisType: string, countryCode: string) => {
    return `${CACHE_KEY_PREFIX}${projectId}_${analysisType}_${countryCode}`;
  };

  const cleanupExpired = () => {
    const now = Date.now();
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    let cleaned = 0;
    keys.forEach(key => {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || '{}') as CacheEntry;
        if (cached.expiresAt && cached.expiresAt < now) {
          localStorage.removeItem(key);
          cleaned++;
        }
      } catch (error) {
        // Invalid entry, remove it
        localStorage.removeItem(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      updateCacheStats();
    }
  };

  const updateCacheStats = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
    setCacheStats(prev => ({
      ...prev,
      size: keys.length,
    }));
  };

  const get = (projectId: string, analysisType: string, countryCode: string): Analysis | null => {
    const key = getCacheKey(projectId, analysisType, countryCode);
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();

      if (entry.expiresAt && entry.expiresAt < now) {
        localStorage.removeItem(key);
        setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
        return null;
      }

      setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return entry.data;
    } catch (error) {
      localStorage.removeItem(key);
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }
  };

  const set = (projectId: string, analysisType: string, countryCode: string, analysis: Analysis) => {
    const key = getCacheKey(projectId, analysisType, countryCode);
    const now = Date.now();

    const entry: CacheEntry = {
      data: analysis,
      timestamp: now,
      expiresAt: now + ttl,
    };

    try {
      // Check cache size and cleanup if needed
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
      if (keys.length >= maxSize) {
        // Remove oldest entries
        const entries = keys
          .map(k => {
            try {
              const cached = JSON.parse(localStorage.getItem(k) || '{}') as CacheEntry;
              return { key: k, timestamp: cached.timestamp || 0 };
            } catch {
              return { key: k, timestamp: 0 };
            }
          })
          .sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest 10% of entries
        const toRemove = Math.ceil(entries.length * 0.1);
        entries.slice(0, toRemove).forEach(({ key }) => {
          localStorage.removeItem(key);
        });
      }

      localStorage.setItem(key, JSON.stringify(entry));
      updateCacheStats();
    } catch (error) {
      console.warn('Failed to cache analysis result:', error);
    }
  };

  const invalidate = (projectId: string, analysisType?: string, countryCode?: string) => {
    if (analysisType && countryCode) {
      const key = getCacheKey(projectId, analysisType, countryCode);
      localStorage.removeItem(key);
    } else {
      // Invalidate all entries for this project
      const prefix = `${CACHE_KEY_PREFIX}${projectId}_`;
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
      keys.forEach(key => localStorage.removeItem(key));
    }
    updateCacheStats();
  };

  const clear = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
    setCacheStats({ hits: 0, misses: 0, size: 0 });
  };

  // Cleanup expired entries on mount and periodically
  useEffect(() => {
    cleanupExpired();
    updateCacheStats();

    const interval = setInterval(cleanupExpired, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return {
    get,
    set,
    invalidate,
    clear,
    stats: cacheStats,
  };
};