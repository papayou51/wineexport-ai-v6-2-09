import { useState, useEffect } from 'react';

export interface ExtractionMetrics {
  totalExtractions: number;
  successRate: number;
  averageQuality: number;
  averageTime: number;
  providerUsage: {
    anthropic: number;
    google: number;
    openai: number;
    fallback: number;
  };
  recentExtractions: ExtractionResult[];
}

export interface ExtractionResult {
  id: string;
  timestamp: Date;
  provider: string;
  success: boolean;
  qualityScore?: number;
  extractionTime: number;
  errorMessage?: string;
  fileName: string;
  providers?: {
    runs?: Array<{
      provider: "openai" | "anthropic" | "google";
      ok?: boolean;
      status?: number | null;
      code?: string | null;
      message?: string;
      ms?: number;
    }>;
  };
}

const STORAGE_KEY = 'extraction_metrics';

export const useExtractionMonitoring = (organizationId: string) => {
  const [realTimeMetrics, setRealTimeMetrics] = useState<ExtractionMetrics>({
    totalExtractions: 0,
    successRate: 0,
    averageQuality: 0,
    averageTime: 0,
    providerUsage: { anthropic: 0, google: 0, openai: 0, fallback: 0 },
    recentExtractions: []
  });

  // Load metrics from localStorage on mount
  useEffect(() => {
    const savedMetrics = localStorage.getItem(`${STORAGE_KEY}_${organizationId}`);
    if (savedMetrics) {
      try {
        const parsed = JSON.parse(savedMetrics);
        // Convert timestamp strings back to Date objects
        parsed.recentExtractions = parsed.recentExtractions.map((extraction: any) => ({
          ...extraction,
          timestamp: new Date(extraction.timestamp)
        }));
        setRealTimeMetrics(parsed);
      } catch (error) {
        console.error('Error loading extraction metrics:', error);
      }
    }

    // Listen for storage events to sync across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_${organizationId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          parsed.recentExtractions = parsed.recentExtractions.map((extraction: any) => ({
            ...extraction,
            timestamp: new Date(extraction.timestamp)
          }));
          setRealTimeMetrics(parsed);
        } catch (error) {
          console.error('Error syncing extraction metrics:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [organizationId]);

  // Save metrics to localStorage whenever they change and dispatch custom event
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_${organizationId}`, JSON.stringify(realTimeMetrics));
    
    // Dispatch custom event for same-tab synchronization
    window.dispatchEvent(new CustomEvent('extractionMetricsUpdated', {
      detail: { organizationId, metrics: realTimeMetrics }
    }));
  }, [realTimeMetrics, organizationId]);

  const getProviderStatus = () => {
    // Determine which providers are currently working based on recent extractions
    const recentSuccessful = realTimeMetrics.recentExtractions
      .filter(result => result.success && 
        new Date(result.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000) // Last 24h
      .slice(0, 5);

    const workingProviders = [...new Set(recentSuccessful.map(r => r.provider))];
    
    return {
      anthropic: workingProviders.includes('anthropic') ? 'working' : 'unknown',
      google: workingProviders.includes('google') ? 'working' : 'unknown',
      // Recognize both openai and openai-assistants as OpenAI working
      openai: (workingProviders.includes('openai') || workingProviders.includes('openai-assistants')) ? 'working' : 'unknown',
      fallback: workingProviders.includes('fallback') ? 'working' : 'unknown'
    };
  };

  const addExtractionResult = (result: Omit<ExtractionResult, 'id' | 'timestamp'>) => {
    const newResult: ExtractionResult = {
      ...result,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    console.log('📊 [DEBUG] Processing extraction result for monitoring:', {
      organizationId,
      result: newResult,
      storageKey: `${STORAGE_KEY}_${organizationId}`
    });

    setRealTimeMetrics(prev => {
      const updatedExtractions = [newResult, ...prev.recentExtractions].slice(0, 10);
      
      // Recalculate metrics based on all extractions (including the new one)
      const totalExtractions = prev.totalExtractions + 1;
      const successfulExtractions = updatedExtractions.filter(e => e.success);
      const successRate = totalExtractions > 0 ? (successfulExtractions.length / Math.min(totalExtractions, updatedExtractions.length)) * 100 : 0;
      
      const qualityScores = updatedExtractions
        .filter(e => e.success && e.qualityScore !== undefined)
        .map(e => e.qualityScore!);
      const averageQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      const extractionTimes = updatedExtractions.map(e => e.extractionTime).filter(t => t > 0);
      const averageTime = extractionTimes.length > 0
        ? extractionTimes.reduce((sum, time) => sum + time, 0) / extractionTimes.length
        : 0;

      // Calculate provider usage based on recent extractions
      const providerUsage = { anthropic: 0, google: 0, openai: 0, fallback: 0 };
      let openaiWins = 0, anthropicWins = 0, googleWins = 0, failed = 0;

      console.log('📊 [DEBUG] Calculating metrics for extractions:', updatedExtractions.map(e => ({ 
        provider: e.provider, 
        success: e.success, 
        hasProviders: !!e.providers,
        providersRuns: e.providers?.runs?.length || 0 
      })));

      updatedExtractions.forEach(extraction => {
        if (extraction.success) {
          // Primary strategy: Use the direct provider field (most reliable)
          // Recognize openai-assistants as OpenAI variant
          if (extraction.provider === "openai" || extraction.provider === "openai-assistants") {
            openaiWins++;
          } else if (extraction.provider === "anthropic") {
            anthropicWins++;  
          } else if (extraction.provider === "google") {
            googleWins++;
          } else {
            // Fallback: Try to extract from providers.runs if direct provider is unknown
            const runs = extraction.providers?.runs || [];
            const winner = runs.find(x => x.ok === true);
            
            if (winner?.provider === "openai") {
              openaiWins++;
            } else if (winner?.provider === "anthropic") {
              anthropicWins++;
            } else if (winner?.provider === "google") {
              googleWins++;
            } else {
              failed++;
            }
          }
        } else {
          failed++;
        }
      });

      console.log('📊 [DEBUG] Provider wins:', { openaiWins, anthropicWins, googleWins, failed });

      const totalProcessed = updatedExtractions.length;
      if (totalProcessed > 0) {
        const share = (n: number) => Math.round(1000 * n / totalProcessed) / 10;
        providerUsage.openai = share(openaiWins);
        providerUsage.anthropic = share(anthropicWins);
        providerUsage.google = share(googleWins);
        providerUsage.fallback = share(failed);
      }

      console.log('📊 [DEBUG] Updated metrics:', {
        totalExtractions,
        successRate,
        averageQuality,
        averageTime,
        providerUsage,
        extractionsCount: updatedExtractions.length
      });

      return {
        totalExtractions,
        successRate,
        averageQuality,
        averageTime,
        providerUsage,
        recentExtractions: updatedExtractions
      };
    });
  };

  return {
    metrics: realTimeMetrics,
    providerStatus: getProviderStatus(),
    addExtractionResult,
    isLoading: false
  };
};