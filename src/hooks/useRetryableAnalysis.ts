import { useState, useCallback } from 'react';
import { useRunAnalysis } from '@/hooks/useAnalyses';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';
import { toast } from '@/hooks/use-toast';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number; // Base delay in ms
  maxDelay?: number;  // Maximum delay in ms
  backoffFactor?: number; // Exponential backoff multiplier
  timeout?: number;   // Request timeout in ms
}

interface AnalysisRequest {
  projectId: string;
  analysisType: 'market_study' | 'regulatory_analysis' | 'lead_generation' | 'marketing_intelligence';
  countryCode: string;
  inputData: any;
}

interface RetryState {
  attempt: number;
  maxRetries: number;
  nextRetryIn?: number;
  isRetrying: boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  timeout: 120000, // 2 minutes
};

export const useRetryableAnalysis = (config: RetryConfig = {}) => {
  const runAnalysis = useRunAnalysis();
  const cache = useAnalysisCache();
  const [retryStates, setRetryStates] = useState<Map<string, RetryState>>(new Map());

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const getRetryKey = (request: AnalysisRequest) => {
    return `${request.projectId}_${request.analysisType}_${request.countryCode}`;
  };

  const calculateDelay = (attempt: number) => {
    const delay = Math.min(
      finalConfig.baseDelay! * Math.pow(finalConfig.backoffFactor!, attempt),
      finalConfig.maxDelay!
    );
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeWithTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  };

  const executeAnalysis = useCallback(async (request: AnalysisRequest): Promise<any> => {
    const retryKey = getRetryKey(request);
    
    // Check cache first
    const cached = cache.get(request.projectId, request.analysisType, request.countryCode);
    if (cached) {
      toast({
        title: "Résultat en cache",
        description: "Analyse récupérée depuis le cache.",
      });
      return cached;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries!; attempt++) {
      const isLastAttempt = attempt === finalConfig.maxRetries!;
      
      // Update retry state
      setRetryStates(prev => {
        const newMap = new Map(prev);
        newMap.set(retryKey, {
          attempt,
          maxRetries: finalConfig.maxRetries!,
          isRetrying: attempt > 0,
          nextRetryIn: isLastAttempt ? undefined : calculateDelay(attempt),
        });
        return newMap;
      });

      try {
        // Add delay for retries
        if (attempt > 0) {
          const delay = calculateDelay(attempt - 1);
          toast({
            title: `Nouvelle tentative (${attempt}/${finalConfig.maxRetries})`,
            description: `Retry dans ${Math.round(delay / 1000)}s...`,
          });
          await sleep(delay);
        }

        // Execute with timeout
        const result = await executeWithTimeout(
          runAnalysis.mutateAsync(request),
          finalConfig.timeout!
        );

        // Cache successful result
        if (result) {
          cache.set(request.projectId, request.analysisType, request.countryCode, result);
        }

        // Clear retry state on success
        setRetryStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(retryKey);
          return newMap;
        });

        return result;

      } catch (error) {
        lastError = error as Error;
        
        if (isLastAttempt) {
          // Clear retry state on final failure
          setRetryStates(prev => {
            const newMap = new Map(prev);
            newMap.delete(retryKey);
            return newMap;
          });

          // Show final error
          toast({
            title: "Échec de l'analyse",
            description: `Impossible de réaliser l'analyse après ${finalConfig.maxRetries! + 1} tentatives: ${lastError.message}`,
            variant: "destructive",
          });

          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error during analysis execution');
  }, [runAnalysis, cache, finalConfig]);

  const getRetryState = useCallback((request: AnalysisRequest): RetryState | undefined => {
    const retryKey = getRetryKey(request);
    return retryStates.get(retryKey);
  }, [retryStates]);

  const cancelRetry = useCallback((request: AnalysisRequest) => {
    const retryKey = getRetryKey(request);
    setRetryStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(retryKey);
      return newMap;
    });
  }, []);

  return {
    executeAnalysis,
    getRetryState,
    cancelRetry,
    isLoading: runAnalysis.isPending,
    error: runAnalysis.error,
    cacheStats: cache.stats,
  };
};