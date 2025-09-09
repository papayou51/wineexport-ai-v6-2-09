import React, { memo, useMemo, useCallback } from 'react';

interface OptimizedComponentProps {
  data?: any[];
  onAction?: (id: string) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Higher-order component for performance optimization
export const withOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return memo((props: P) => {
    return <Component {...props} />;
  });
};

// Example optimized component
const OptimizedComponent = memo<OptimizedComponentProps>(({ 
  data = [], 
  onAction,
  isLoading = false,
  children 
}) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }));
  }, [data]);

  // Memoize callback functions
  const handleAction = useCallback((id: string) => {
    onAction?.(id);
  }, [onAction]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="optimized-component">
      {processedData.map((item) => (
        <div key={item.id} onClick={() => handleAction(item.id)}>
          {item.name}
        </div>
      ))}
      {children}
    </div>
  );
});

OptimizedComponent.displayName = 'OptimizedComponent';

export default OptimizedComponent;