export const SENTRY_CONFIG = {
  // Your Sentry DSN from the onboarding
  DSN: "https://26d5d6095914c2f5a8d3a7cd449c2321@o4509565914972160.ingest.us.sentry.io/4509565921394688",
  
  // Environment configuration
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
  
  // Enable/disable Sentry based on environment
  ENABLED: true,
  
  // Debug mode for development
  DEBUG: __DEV__,
  
  // Performance monitoring settings
  TRACES_SAMPLE_RATE: __DEV__ ? 1.0 : 0.1,
  
  // Profiling settings
  PROFILES_SAMPLE_RATE: __DEV__ ? 1.0 : 0.1,
  
  // Session replay settings
  REPLAYS_SESSION_SAMPLE_RATE: __DEV__ ? 1.0 : 0.1,
  REPLAYS_ON_ERROR_SAMPLE_RATE: 1.0,
  
  // Default tags for all events
  DEFAULT_TAGS: {
    platform: 'react-native',
    app_version: process.env.EXPO_PUBLIC_APP_VERSION || '0.1.0',
  },
  
  // Default context for all events
  DEFAULT_CONTEXT: {
    app: {
      name: 'Tmaxx Habit Tracker',
      version: process.env.EXPO_PUBLIC_APP_VERSION || '0.1.0',
    },
  },
} as const;

/**
 * Validate Sentry configuration
 */
export function validateSentryConfig(): boolean {
  if (!SENTRY_CONFIG.DSN) {
    console.error('Sentry DSN is not configured');
    return false;
  }
  
  if (!SENTRY_CONFIG.DSN.startsWith('https://')) {
    console.error('Sentry DSN format is invalid');
    return false;
  }
  
  return true;
} 