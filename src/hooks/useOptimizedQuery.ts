import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  dependencies?: any[];
}

export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  dependencies = [],
  ...options
}: OptimizedQueryOptions<T>) => {
  // Memoize the query key to prevent unnecessary re-renders
  const memoizedQueryKey = useMemo(() => queryKey, dependencies);
  
  // Memoize the query function
  const memoizedQueryFn = useCallback(queryFn, dependencies);

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: memoizedQueryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in v5)
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useOptimizedMutation = () => {
  // Utility for optimized mutations with loading states
  // Can be extended based on needs
};