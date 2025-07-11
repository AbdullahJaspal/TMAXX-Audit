import { useCallback } from 'react';
import { useSentry } from '@/contexts/SentryContext';

/**
 * Hook that provides error handling with Sentry integration
 * Use this to wrap async operations and catch errors
 */
export function useSentryErrorBoundary() {
  const { captureError, addBreadcrumb } = useSentry();

  const handleError = useCallback((error: Error, context?: Record<string, any>) => {
    // Add breadcrumb for the error
    addBreadcrumb({
      message: 'Error occurred',
      category: 'error',
      level: 'error',
      data: {
        error_message: error.message,
        error_name: error.name,
        ...context,
      },
    });

    // Capture the error in Sentry
    captureError(error, {
      tags: context?.tags,
      extra: {
        ...context?.extra,
        error_stack: error.stack,
        error_name: error.name,
      },
    });

    // Re-throw the error for other error boundaries or handlers
    throw error;
  }, [captureError, addBreadcrumb]);

  const wrapAsync = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error as Error, context);
        throw error;
      }
    };
  }, [handleError]);

  return {
    handleError,
    wrapAsync,
  };
} 