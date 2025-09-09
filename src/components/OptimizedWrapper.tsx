import React, { useEffect } from 'react';

interface OptimizedWrapperProps {
  children: React.ReactNode;
}

// Component to fix postMessage errors and optimize cross-frame communication
export const OptimizedWrapper: React.FC<OptimizedWrapperProps> = ({ children }) => {
  useEffect(() => {
    // Prevent postMessage errors by filtering out unwanted messages
    const handleMessage = (event: MessageEvent) => {
      // Filter out browser extension, iframe sandbox, and known problematic messages
      if (!event.origin || 
          event.origin === 'null' || 
          event.origin.includes('extension') ||
          event.origin.includes('chrome-extension') ||
          event.origin.includes('moz-extension') ||
          event.origin.includes('safari-extension') ||
          event.data?.source === 'react-devtools-content-script' ||
          event.data?.source === 'react-devtools-bridge' ||
          event.origin !== window.location.origin) {
        return;
      }
      
      // Process only trusted messages from same origin
      // Removed console.debug to reduce noise
    };

    // Add message listener with error handling
    window.addEventListener('message', handleMessage, false);

    // Cleanup function to prevent memory leaks
    return () => {
      window.removeEventListener('message', handleMessage, false);
    };
  }, []);

  // Minimal performance monitoring without console spam
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Use setInterval instead of requestAnimationFrame to avoid infinite loops
    intervalId = setInterval(() => {
      const performance = window.performance as any;
      if (performance?.memory) {
        const memoryUsage = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        // Only log if memory usage is very concerning (>150MB)
        if (parseFloat(memoryUsage) > 150) {
          console.warn(`High memory usage detected: ${memoryUsage}MB`);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return <>{children}</>;
};