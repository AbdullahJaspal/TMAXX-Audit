import React, { createContext, useContext, useEffect, useState } from 'react';
import { analytics } from '@/lib/analytics/service';

interface AnalyticsContextType {
  track: (eventName: string, eventProperties?: Record<string, any>) => void;
  trackScreenView: (screenName: string, screenProperties?: Record<string, any>) => void;
  trackUserAction: (action: string, actionProperties?: Record<string, any>) => void;
  trackFeatureUsage: (feature: string, featureProperties?: Record<string, any>) => void;
  trackError: (error: Error, errorContext?: Record<string, any>) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  identify: (properties: Record<string, any>) => void;
  isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAnalytics = async () => {
      const success = await analytics.initialize();
      setIsReady(success);
    };

    initializeAnalytics();
  }, []);

  const track = (eventName: string, eventProperties?: Record<string, any>) => {
    analytics.track(eventName, eventProperties);
  };

  const trackScreenView = (screenName: string, screenProperties?: Record<string, any>) => {
    analytics.trackScreenView(screenName, screenProperties);
  };

  const trackUserAction = (action: string, actionProperties?: Record<string, any>) => {
    analytics.trackUserAction(action, actionProperties);
  };

  const trackFeatureUsage = (feature: string, featureProperties?: Record<string, any>) => {
    analytics.trackFeatureUsage(feature, featureProperties);
  };

  const trackError = (error: Error, errorContext?: Record<string, any>) => {
    analytics.trackError(error, errorContext);
  };

  const setUserId = (userId: string) => {
    analytics.setUserId(userId);
  };

  const setUserProperties = (properties: Record<string, any>) => {
    analytics.setUserProperties(properties);
  };

  const identify = (properties: Record<string, any>) => {
    analytics.identify(properties);
  };

  const value: AnalyticsContextType = {
    track,
    trackScreenView,
    trackUserAction,
    trackFeatureUsage,
    trackError,
    setUserId,
    setUserProperties,
    identify,
    isReady,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}; 