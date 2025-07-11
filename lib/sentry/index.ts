// Core Sentry service
export { sentry } from './service';

// Configuration
export { SENTRY_CONFIG, validateSentryConfig } from './config';

// Development-friendly logging utilities
export {
  logInfo,
  logWarning,
  logError,
  logDebug,
  trackUserAction,
  trackApiCall,
} from './utils';

// Re-export Sentry types for convenience
export type { Breadcrumb, SeverityLevel } from '@sentry/react-native'; 