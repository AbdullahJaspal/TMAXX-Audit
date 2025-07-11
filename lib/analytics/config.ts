import { getAnalyticsVersion } from '@/lib/utils/version';

export const ANALYTICS_CONFIG = {
  // You'll need to add your Amplitude API key to your .env file
  AMPLITUDE_API_KEY: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '',
  
  // Environment configuration
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
  
  // Default event properties
  DEFAULT_EVENT_PROPERTIES: {
    app_version: getAnalyticsVersion(), // Dynamic version from package.json
    platform: 'mobile',
    environment: process.env.NODE_ENV || 'development',
  },
  
  // User properties to track
  USER_PROPERTIES: {
    // Add any default user properties you want to track
    has_completed_onboarding: false,
    subscription_status: 'free',
  },
} as const;

// Validate configuration
export const validateAnalyticsConfig = () => {
  if (!ANALYTICS_CONFIG.AMPLITUDE_API_KEY) {
    console.warn(
      'Amplitude API key is missing. Please add EXPO_PUBLIC_AMPLITUDE_API_KEY to your .env file.'
    );
    return false;
  }
  return true;
}; 