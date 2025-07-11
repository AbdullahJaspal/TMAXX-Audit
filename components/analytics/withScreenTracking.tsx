import React, { useEffect } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ScreenName } from '@/lib/analytics/events';

interface WithScreenTrackingProps {
  screenName: ScreenName;
  screenProperties?: Record<string, any>;
}

export function withScreenTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: ScreenName,
  defaultScreenProperties?: Record<string, any>
) {
  const WithScreenTrackingComponent: React.FC<P & WithScreenTrackingProps> = (props) => {
    const { trackScreenView } = useAnalytics();

    useEffect(() => {
      trackScreenView(screenName, {
        ...defaultScreenProperties,
        ...props.screenProperties,
      });
    }, [trackScreenView, props.screenProperties]);

    return <WrappedComponent {...props} />;
  };

  WithScreenTrackingComponent.displayName = `withScreenTracking(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithScreenTrackingComponent;
}

// Hook version for functional components
export function useScreenTracking(screenName: ScreenName, screenProperties?: Record<string, any>) {
  const { trackScreenView } = useAnalytics();

  useEffect(() => {
    trackScreenView(screenName, screenProperties);
  }, [trackScreenView, screenName, screenProperties]);
} 