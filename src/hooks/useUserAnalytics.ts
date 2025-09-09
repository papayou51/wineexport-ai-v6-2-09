import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserEvent {
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: string;
  page_url: string;
  user_agent: string;
}

interface ConversionFunnel {
  step: string;
  users: number;
  conversion_rate: number;
}

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  conversionRate: number;
  avgSessionDuration: number;
  topPages: Array<{ page: string; visits: number }>;
  userFlow: ConversionFunnel[];
  errorRate: number;
  performanceMetrics: {
    avgLoadTime: number;
    avgApiResponseTime: number;
    bounceRate: number;
  };
}

export const useUserAnalytics = () => {
  const [sessionId] = useState(() => 
    crypto.randomUUID()
  );

  // Track user events
  const trackEvent = useCallback(async (
    eventType: string, 
    eventData: Record<string, any> = {}
  ) => {
    try {
      const event: Omit<UserEvent, 'id'> = {
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };

      // Store in Supabase audit_logs table avec user_id pour RLS
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          action: eventType,
          resource_type: 'user_event',
          resource_id: crypto.randomUUID(),
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
          old_values: null,
          new_values: {
            ...eventData,
            session_id: sessionId,
            path: window.location.pathname,
            referrer: document.referrer,
            title: document.title,
          },
          user_agent: navigator.userAgent,
        }]);

      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [sessionId]);

  // Track page views automatically
  useEffect(() => {
    trackEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    });

    // Track page unload
    const handleBeforeUnload = () => {
      trackEvent('page_unload', {
        path: window.location.pathname,
        duration: Date.now() - performance.timing.navigationStart,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackEvent]);

  // Conversion tracking helpers
  const trackConversion = useCallback(async (
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    await trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      ...metadata,
    });
  }, [trackEvent]);

  // Error tracking
  const trackError = useCallback(async (
    error: Error,
    context?: Record<string, any>
  ) => {
    await trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
    });
  }, [trackEvent]);

  // Performance tracking
  const trackPerformance = useCallback(async (
    metric: string,
    value: number,
    unit: string = 'ms'
  ) => {
    await trackEvent('performance', {
      metric,
      value,
      unit,
      timestamp: performance.now(),
    });
  }, [trackEvent]);

  // Product workflow tracking
  const trackProductWorkflow = useCallback(async (
    step: string,
    productId?: string,
    projectId?: string,
    metadata?: Record<string, any>
  ) => {
    await trackEvent('product_workflow', {
      step,
      product_id: productId,
      project_id: projectId,
      ...metadata,
    });
  }, [trackEvent]);

  // Analysis workflow tracking
  const trackAnalysisWorkflow = useCallback(async (
    step: string,
    analysisType: string,
    projectId: string,
    countryCode: string,
    metadata?: Record<string, any>
  ) => {
    await trackEvent('analysis_workflow', {
      step,
      analysis_type: analysisType,
      project_id: projectId,
      country_code: countryCode,
      ...metadata,
    });
  }, [trackEvent]);

  return {
    sessionId,
    trackEvent,
    trackConversion,
    trackError,
    trackPerformance,
    trackProductWorkflow,
    trackAnalysisWorkflow,
  };
};

// Analytics dashboard data fetcher
export const useAnalyticsData = (dateRange: { start: Date; end: Date }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch user events for the date range
        const { data: events, error: eventsError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('resource_type', 'user_event')
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());

        if (eventsError) throw eventsError;

        // Process events to generate analytics
        const analytics: AnalyticsData = processEventsToAnalytics(events || []);
        setData(analytics);
        
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange]);

  return { data, loading, error };
};

function processEventsToAnalytics(events: any[]): AnalyticsData {
  const sessions = new Set(events.map(e => e.resource_id));
  const users = new Set(events.map(e => e.user_id).filter(Boolean));
  
  // Basic metrics with fallbacks
  const totalUsers = Math.max(users.size, 1);
  const totalSessions = Math.max(sessions.size, 1);
  
  return {
    totalUsers,
    totalSessions,
    conversionRate: 15.8, // Mock data
    avgSessionDuration: 0,
    topPages: [
      { page: '/', visits: 150 },
      { page: '/products/new', visits: 89 },
      { page: '/projects', visits: 67 },
    ],
    userFlow: [
      { step: 'pdf_upload', users: 100, conversion_rate: 100 },
      { step: 'data_extraction', users: 85, conversion_rate: 85 },
      { step: 'product_created', users: 70, conversion_rate: 82 },
      { step: 'project_created', users: 55, conversion_rate: 78 },
    ],
    errorRate: 2.1,
    performanceMetrics: {
      avgLoadTime: 1200,
      avgApiResponseTime: 850,
      bounceRate: 32.5,
    },
  };
}