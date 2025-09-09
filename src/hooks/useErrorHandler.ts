import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  onError?: (error: Error) => void;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: Error | string, context?: string) => void;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => (...args: T) => Promise<R | undefined>;
}

export const useErrorHandler = (
  options: ErrorHandlerOptions = {}
): UseErrorHandlerReturn => {
  const { showToast = true, logToConsole = true, onError } = options;
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((
    errorInput: Error | string, 
    context?: string
  ) => {
    const error = errorInput instanceof Error 
      ? errorInput 
      : new Error(errorInput);

    setError(error);

    if (logToConsole) {
      const errorMessage = context 
        ? `[${context}] ${error.message}` 
        : error.message;
      console.error(errorMessage, error);
    }

    if (showToast) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: context 
          ? `${context}: ${error.message}`
          : error.message,
      });
    }

    if (onError) {
      onError(error);
    }
  }, [toast, showToast, logToConsole, onError]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        clearError();
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, context);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  return {
    error,
    isError: error !== null,
    clearError,
    handleError,
    withErrorHandling,
  };
};

// Hook spécialisé pour les erreurs API
export const useApiErrorHandler = () => {
  return useErrorHandler({
    showToast: true,
    logToConsole: true,
    onError: (error) => {
      // Ici on pourrait envoyer l'erreur à un service de monitoring
      console.error("API Error:", error);
    },
  });
};

// Hook pour les erreurs de formulaire
export const useFormErrorHandler = () => {
  return useErrorHandler({
    showToast: false, // Les erreurs de formulaire sont généralement affichées inline
    logToConsole: true,
  });
};