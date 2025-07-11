import * as Sentry from '@sentry/react-native';
import { SENTRY_CONFIG, validateSentryConfig } from './config';

class SentryService {
  private isInitialized = false;
  private currentUser: { id?: string; email?: string; username?: string } = {};

  /**
   * Initialize Sentry
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('Sentry already initialized');
      return true;
    }

    if (!validateSentryConfig()) {
      console.error('Sentry configuration is invalid');
      return false;
    }

    if (!SENTRY_CONFIG.ENABLED) {
      console.log('Sentry is disabled');
      return false;
    }

    try {
      Sentry.init({
        dsn: SENTRY_CONFIG.DSN,
        environment: SENTRY_CONFIG.ENVIRONMENT,
        debug: SENTRY_CONFIG.DEBUG,
        
        // Performance monitoring
        tracesSampleRate: SENTRY_CONFIG.TRACES_SAMPLE_RATE,
        profilesSampleRate: SENTRY_CONFIG.PROFILES_SAMPLE_RATE,
        
        // Session replay
        replaysSessionSampleRate: SENTRY_CONFIG.REPLAYS_SESSION_SAMPLE_RATE,
        replaysOnErrorSampleRate: SENTRY_CONFIG.REPLAYS_ON_ERROR_SAMPLE_RATE,
        
        // Data collection settings
        sendDefaultPii: true,
        
        // Enable automatic instrumentation
        enableAutoSessionTracking: true,
        enableTracing: true,
        
        // React Native specific settings
        enableNativeCrashHandling: true,
        attachStacktrace: true,
        
        // Before send hook to filter events
        beforeSend(event, hint) {
          // Filter out certain errors in development
          if (__DEV__ && event.exception) {
            const exception = event.exception.values?.[0];
            if (exception?.type === 'Error' && exception.value?.includes('My first Sentry error!')) {
              console.log('Filtered out test error in development');
              return null;
            }
          }
          return event;
        },
        
        // Before breadcrumb hook
        beforeBreadcrumb(breadcrumb, hint) {
          // Filter out sensitive breadcrumbs
          if (breadcrumb.category === 'navigation' && breadcrumb.data?.url?.includes('password')) {
            return null;
          }
          return breadcrumb;
        },
      });

      this.isInitialized = true;
      console.log('Sentry initialized successfully');
      
      // Set default tags and context
      this.setTag('platform', SENTRY_CONFIG.DEFAULT_TAGS.platform);
      this.setTag('app_version', SENTRY_CONFIG.DEFAULT_TAGS.app_version);
      this.setContext('app', SENTRY_CONFIG.DEFAULT_CONTEXT.app);
      
      // Capture app launch event
      this.captureMessage('App launched', 'info');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
      return false;
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Error not captured:', error.message);
      return;
    }

    try {
      Sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level || 'error',
      });
      
      // Also log to console in development for easy debugging
      if (__DEV__) {
        console.group('🚨 Sentry Error Captured');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        if (context?.tags) {
          console.log('Tags:', context.tags);
        }
        if (context?.extra) {
          console.log('Extra:', context.extra);
        }
        if (context?.user) {
          console.log('User:', context.user);
        }
        console.groupEnd();
      }
    } catch (sentryError) {
      console.error('Failed to capture error in Sentry:', sentryError);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Message not captured:', message);
      return;
    }

    try {
      Sentry.captureMessage(message, {
        level,
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
      });
      
      // Also log to console in development for easy debugging
      if (__DEV__) {
        const emoji = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
        console.group(`${emoji} Sentry Message (${level})`);
        console.log('Message:', message);
        if (context?.tags) {
          console.log('Tags:', context.tags);
        }
        if (context?.extra) {
          console.log('Extra:', context.extra);
        }
        if (context?.user) {
          console.log('User:', context.user);
        }
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to capture message in Sentry:', error);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string; [key: string]: any }): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot set user');
      return;
    }

    try {
      this.currentUser = user;
      Sentry.setUser(user);
      console.log('Sentry user set:', user);
    } catch (error) {
      console.error('Failed to set Sentry user:', error);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.currentUser = {};
      Sentry.setUser(null);
      console.log('Sentry user cleared');
    } catch (error) {
      console.error('Failed to clear Sentry user:', error);
    }
  }

  /**
   * Set user context with additional data
   */
  setUserContext(context: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot set user context');
      return;
    }

    try {
      Sentry.setContext('user', context);
      console.log('Sentry user context set:', context);
    } catch (error) {
      console.error('Failed to set Sentry user context:', error);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot add breadcrumb');
      return;
    }

    try {
      Sentry.addBreadcrumb(breadcrumb);
      
      // Also log to console in development for easy debugging
      if (__DEV__) {
        const emoji = breadcrumb.level === 'error' ? '❌' : breadcrumb.level === 'warning' ? '⚠️' : breadcrumb.level === 'info' ? 'ℹ️' : '🔍';
        console.group(`${emoji} Sentry Breadcrumb (${breadcrumb.category || 'manual'})`);
        console.log('Message:', breadcrumb.message);
        console.log('Level:', breadcrumb.level);
        if (breadcrumb.data) {
          console.log('Data:', breadcrumb.data);
        }
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to add Sentry breadcrumb:', error);
    }
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot set tag');
      return;
    }

    try {
      Sentry.setTag(key, value);
      console.log('Sentry tag set:', key, value);
    } catch (error) {
      console.error('Failed to set Sentry tag:', error);
    }
  }

  /**
   * Set extra data
   */
  setExtra(key: string, value: any): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot set extra');
      return;
    }

    try {
      Sentry.setExtra(key, value);
      console.log('Sentry extra set:', key, value);
    } catch (error) {
      console.error('Failed to set Sentry extra:', error);
    }
  }

  /**
   * Set context
   */
  setContext(name: string, context: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot set context');
      return;
    }

    try {
      Sentry.setContext(name, context);
      console.log('Sentry context set:', name, context);
    } catch (error) {
      console.error('Failed to set Sentry context:', error);
    }
  }

  /**
   * Force a native crash (for testing)
   */
  nativeCrash(): void {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized. Cannot trigger native crash');
      return;
    }

    try {
      Sentry.nativeCrash();
    } catch (error) {
      console.error('Failed to trigger native crash:', error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): { id?: string; email?: string; username?: string } {
    return { ...this.currentUser };
  }

  /**
   * Check if Sentry is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Close Sentry (useful for cleanup)
   */
  async close(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Sentry.close();
      this.isInitialized = false;
      console.log('Sentry closed');
    } catch (error) {
      console.error('Failed to close Sentry:', error);
    }
  }
}

// Export singleton instance
export const sentry = new SentryService(); 