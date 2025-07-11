// Core analytics service
export { analytics } from './service';

// Configuration
export { ANALYTICS_CONFIG, validateAnalyticsConfig } from './config';

// Events and types
export {
  ANALYTICS_EVENTS,
  SCREEN_NAMES,
  USER_PROPERTIES,
  type AnalyticsEventName,
  type ScreenName,
  type UserProperty,
  type BaseEventProperties,
  type ScreenViewProperties,
  type UserActionProperties,
  type FeatureUsageProperties,
  type ErrorProperties,
} from './events';

// React components and hooks
export { withScreenTracking, useScreenTracking } from '@/components/analytics/withScreenTracking';
export { useAnalytics, AnalyticsProvider } from '@/contexts/AnalyticsContext'; 