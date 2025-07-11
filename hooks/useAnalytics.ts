import { useCallback, useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics/service';

/**
 * Hook for using analytics throughout the app
 */
export const useAnalytics = () => {
  const isInitialized = useRef(false);

  // Initialize analytics on first use
  useEffect(() => {
    if (!isInitialized.current) {
      analytics.initialize().then((success) => {
        isInitialized.current = success;
      });
    }
  }, []);

  const track = useCallback((eventName: string, eventProperties?: Record<string, any>) => {
    analytics.track(eventName, eventProperties);
  }, []);

  const trackScreenView = useCallback((screenName: string, screenProperties?: Record<string, any>) => {
    analytics.trackScreenView(screenName, screenProperties);
  }, []);

  const trackUserAction = useCallback((action: string, actionProperties?: Record<string, any>) => {
    analytics.trackUserAction(action, actionProperties);
  }, []);

  const trackFeatureUsage = useCallback((feature: string, featureProperties?: Record<string, any>) => {
    analytics.trackFeatureUsage(feature, featureProperties);
  }, []);

  const trackError = useCallback((error: Error, errorContext?: Record<string, any>) => {
    analytics.trackError(error, errorContext);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analytics.setUserId(userId);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    analytics.setUserProperties(properties);
  }, []);

  const identify = useCallback((properties: Record<string, any>) => {
    analytics.identify(properties);
  }, []);

  return {
    track,
    trackScreenView,
    trackUserAction,
    trackFeatureUsage,
    trackError,
    setUserId,
    setUserProperties,
    identify,
    isReady: analytics.isReady(),
  };
}; 