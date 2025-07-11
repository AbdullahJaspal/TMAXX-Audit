import { init, track, setUserId, identify, Identify } from '@amplitude/analytics-react-native';
import { ANALYTICS_CONFIG, validateAnalyticsConfig } from './config';

class AnalyticsService {
  private isInitialized = false;

  /**
   * Initialize Amplitude analytics
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('Analytics already initialized');
      return true;
    }

    if (!validateAnalyticsConfig()) {
      console.error('Analytics configuration is invalid');
      return false;
    }

    try {
      await init(ANALYTICS_CONFIG.AMPLITUDE_API_KEY);

      this.isInitialized = true;
      console.log('Analytics initialized successfully');
      
      // Track app launch event
      this.track('app_launched', {
        ...ANALYTICS_CONFIG.DEFAULT_EVENT_PROPERTIES,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      // Also capture in Sentry if available
      this.captureErrorInSentry(error as Error, { context: 'analytics_initialization' });
      return false;
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, eventProperties?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Event not tracked:', eventName);
      return;
    }

    try {
      const properties = {
        ...ANALYTICS_CONFIG.DEFAULT_EVENT_PROPERTIES,
        ...eventProperties,
        timestamp: new Date().toISOString(),
      };

      track(eventName, properties);
      
      if (__DEV__) {
        console.log('📊 Analytics Event:', eventName, properties);
      }
    } catch (error) {
      console.error('Failed to track event:', eventName, error);
      // Also capture in Sentry if available
      this.captureErrorInSentry(error as Error, { 
        context: 'analytics_tracking',
        event_name: eventName,
        event_properties: eventProperties,
      });
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Cannot set user ID');
      return;
    }

    try {
      setUserId(userId);
      console.log('User ID set:', userId);
    } catch (error) {
      console.error('Failed to set user ID:', error);
      // Also capture in Sentry if available
      this.captureErrorInSentry(error as Error, { 
        context: 'analytics_set_user_id',
        user_id: userId,
      });
    }
  }

  /**
   * Set user properties using identify
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Cannot set user properties');
      return;
    }

    try {
      this.identify(properties);
      console.log('User properties set:', properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
      // Also capture in Sentry if available
      this.captureErrorInSentry(error as Error, { 
        context: 'analytics_set_user_properties',
        properties,
      });
    }
  }

  /**
   * Identify user with specific properties
   */
  identify(properties: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Cannot identify user');
      return;
    }

    try {
      const identifyObj = new Identify();
      
      // Add properties to identify object
      Object.entries(properties).forEach(([key, value]) => {
        identifyObj.set(key, value);
      });

      identify(identifyObj);
      console.log('User identified with properties:', properties);
    } catch (error) {
      console.error('Failed to identify user:', error);
      // Also capture in Sentry if available
      this.captureErrorInSentry(error as Error, { 
        context: 'analytics_identify',
        properties,
      });
    }
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, screenProperties?: Record<string, any>): void {
    this.track('screen_viewed', {
      screen_name: screenName,
      ...screenProperties,
    });
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, actionProperties?: Record<string, any>): void {
    this.track('user_action', {
      action,
      ...actionProperties,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, featureProperties?: Record<string, any>): void {
    this.track('feature_used', {
      feature,
      ...featureProperties,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, errorContext?: Record<string, any>): void {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...errorContext,
    });
    
    // Also capture in Sentry if available
    this.captureErrorInSentry(error, errorContext);
  }

  /**
   * Capture error in Sentry if available
   */
  private captureErrorInSentry(error: Error, context?: Record<string, any>): void {
    try {
      // Dynamically import Sentry to avoid circular dependencies
      const { sentry } = require('@/lib/sentry');
      if (sentry && sentry.isReady()) {
        sentry.captureError(error, {
          tags: { 
            service: 'analytics',
            ...context?.tags,
          },
          extra: {
            ...context,
            error_stack: error.stack,
            error_name: error.name,
          },
        });
      }
    } catch (sentryError) {
      // Sentry not available or failed to capture, ignore
      console.log('Sentry not available for error capture');
    }
  }

  /**
   * Check if analytics is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService(); 