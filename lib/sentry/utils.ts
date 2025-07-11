import { sentry } from './service';

/**
 * Development-friendly logging utilities
 * Use these instead of console.log/error for better debugging and production monitoring
 */

/**
 * Log info message (replaces console.log)
 * In development: logs to console with Sentry breadcrumb
 * In production: only sends to Sentry
 */
export function logInfo(message: string, data?: Record<string, any>, category: string = 'info'): void {
  if (__DEV__) {
    console.log(`ℹ️ ${message}`, data || '');
  }
  
  sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Log warning message (replaces console.warn)
 * In development: logs to console with Sentry message
 * In production: only sends to Sentry
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  if (__DEV__) {
    console.warn(`⚠️ ${message}`, context || '');
  }
  
  sentry.captureMessage(message, 'warning', context);
}

/**
 * Log error message (replaces console.error)
 * In development: logs to console with Sentry error
 * In production: only sends to Sentry
 */
export function logError(message: string, error?: Error, context?: Record<string, any>): void {
  if (__DEV__) {
    console.error(`❌ ${message}`, error || context || '');
  }
  
  if (error) {
    sentry.captureError(error, {
      extra: { message, ...context },
    });
  } else {
    sentry.captureMessage(message, 'error', context);
  }
}

/**
 * Log debug message (replaces console.log for debugging)
 * Only logs in development, never in production
 */
export function logDebug(message: string, data?: Record<string, any>): void {
  if (__DEV__) {
    console.log(`🔍 ${message}`, data || '');
  }
  
  // Don't send debug messages to Sentry to avoid noise
}

/**
 * Track user action (replaces console.log for user actions)
 * In development: logs to console with Sentry breadcrumb
 * In production: only sends to Sentry
 */
export function trackUserAction(action: string, data?: Record<string, any>): void {
  if (__DEV__) {
    console.log(`👤 User Action: ${action}`, data || '');
  }
  
  sentry.addBreadcrumb({
    message: action,
    category: 'user_action',
    level: 'info',
    data,
  });
}

/**
 * Track API call (replaces console.log for API calls)
 * In development: logs to console with Sentry breadcrumb
 * In production: only sends to Sentry
 */
export function trackApiCall(endpoint: string, method: string, data?: Record<string, any>): void {
  if (__DEV__) {
    console.log(`🌐 API Call: ${method} ${endpoint}`, data || '');
  }
  
  sentry.addBreadcrumb({
    message: `${method} ${endpoint}`,
    category: 'api_call',
    level: 'info',
    data,
  });
} 