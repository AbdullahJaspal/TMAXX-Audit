# Sentry Integration

This directory contains the Sentry.io integration for remote error tracking in the Tmaxx Habit Tracker app.

## Overview

Sentry provides comprehensive error monitoring, performance tracking, and session replay capabilities. The integration is built in a modular way that follows the same patterns as the existing analytics system.

## What Was Implemented

### 1. Core Sentry Service (`lib/sentry/`)
- **`config.ts`**: Environment-based configuration with your DSN
- **`service.ts`**: Comprehensive Sentry service with error tracking, user context, breadcrumbs, and performance monitoring
- **`index.ts`**: Clean exports for easy importing

### 2. React Context Integration (`contexts/SentryContext.tsx`)
- Automatic initialization and user context management
- Integration with existing `AuthContext` and `UserContext`
- Provides hooks for easy Sentry usage throughout the app

### 3. App Integration (`app/_layout.tsx`)
- Added `SentryProvider` to the provider tree
- Positioned to capture errors from all app components

### 4. Error Boundary Hook (`hooks/useSentryErrorBoundary.ts`)
- Utility hook for wrapping async operations with error tracking
- Automatic breadcrumb and error capture

### 5. Testing Component (`components/SentryTest.tsx`)
- Development-only component for testing Sentry functionality
- Added to settings screen for easy testing

### 6. Analytics Integration (`lib/analytics/service.ts`)
- Enhanced analytics service to also capture errors in Sentry
- Demonstrates cross-service error tracking

## Features

- ✅ **Error Monitoring**: Automatic capture of JavaScript and native crashes
- ✅ **Performance Monitoring**: Transaction and span tracking
- ✅ **Session Replay**: User session recordings for debugging
- ✅ **User Context**: Automatic user identification and context setting
- ✅ **Breadcrumbs**: Detailed event trail for debugging
- ✅ **Environment-based Configuration**: Different settings for dev/prod

## Configuration

### Environment Variables

The Sentry configuration is located in `lib/sentry/config.ts`:

```typescript
export const SENTRY_CONFIG = {
  DSN: "https://26d5d6095914c2f5a8d3a7cd449c2321@o4509565914972160.ingest.us.sentry.io/4509565921394688",
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
  ENABLED: true,
  DEBUG: __DEV__,
  // ... more config
};
```

### Sample Rates

- **Development**: 100% sampling for all features
- **Production**: 10% sampling for performance, 100% for errors

## Usage

### Development-Friendly Logging Utilities

Instead of using `console.log`, `console.error`, etc., use these utilities for better debugging and production monitoring:

```typescript
import { logInfo, logWarning, logError, logDebug, trackUserAction, trackApiCall } from '@/lib/sentry';

// Replace console.log
logInfo('User data loaded', { user_id: '123', habits_count: 5 });

// Replace console.warn
logWarning('API rate limit approaching', { endpoint: '/api/habits', remaining: 10 });

// Replace console.error
logError('Failed to save habit', error, { habit_id: '456' });

// Debug only (development only, never sent to Sentry)
logDebug('Processing habit data', { raw_data: habitData });

// Track user actions
trackUserAction('habit_completed', { habit_id: '789', streak: 5 });

// Track API calls
trackApiCall('/api/habits', 'POST', { habit_name: 'Exercise' });
```

**Benefits:**
- ✅ **Development**: Still see logs in console for easy debugging
- ✅ **Production**: Only Sentry gets the data (no console noise)
- ✅ **Structured**: All logs include context and categorization
- ✅ **Searchable**: Find all logs related to specific operations
- ✅ **Breadcrumbs**: Automatic trail of user actions and API calls

### Basic Error Tracking

```typescript
import { useSentry } from '@/contexts/SentryContext';

function MyComponent() {
  const { captureError, captureMessage } = useSentry();

  const handleError = () => {
    try {
      // Some risky operation
      throw new Error('Something went wrong');
    } catch (error) {
      captureError(error as Error, {
        tags: { component: 'MyComponent' },
        extra: { additional_data: 'context' },
      });
    }
  };

  const logInfo = () => {
    captureMessage('User performed action', 'info', {
      tags: { action: 'button_click' },
    });
  };
}
```

### Error Boundary Hook

For wrapping async operations:

```typescript
import { useSentryErrorBoundary } from '@/hooks/useSentryErrorBoundary';

function MyComponent() {
  const { wrapAsync } = useSentryErrorBoundary();

  const fetchData = wrapAsync(async () => {
    const response = await fetch('/api/data');
    return response.json();
  }, { tags: { operation: 'fetch_data' } });

  const handlePress = async () => {
    try {
      const data = await fetchData();
      // Handle success
    } catch (error) {
      // Error is automatically captured by Sentry
      console.error('Failed to fetch data:', error);
    }
  };
}
```

### Adding Breadcrumbs

```typescript
import { useSentry } from '@/contexts/SentryContext';

function MyComponent() {
  const { addBreadcrumb } = useSentry();

  const handleNavigation = () => {
    addBreadcrumb({
      message: 'User navigated to settings',
      category: 'navigation',
      level: 'info',
      data: { screen: 'settings' },
    });
    
    // Navigate to settings
  };
}
```

### Setting User Context

The user context is automatically set when a user logs in, but you can manually set additional context:

```typescript
import { useSentry } from '@/contexts/SentryContext';

function MyComponent() {
  const { setUser, setContext } = useSentry();

  const updateUserContext = () => {
    setUser({
      id: 'user123',
      email: 'user@example.com',
      username: 'user123',
      plan: 'premium',
    });

    setContext('subscription', {
      plan: 'premium',
      expiresAt: '2024-12-31',
    });
  };
}
```

## Testing

### Development Testing

Use the `SentryTest` component to verify Sentry is working:

```typescript
import SentryTest from '@/components/SentryTest';

// Add to any screen for testing
<SentryTest />
```

The component is automatically added to the Settings screen in development mode.

### Production Verification

1. Check Sentry dashboard for events
2. Verify user context is being set
3. Monitor error rates and performance metrics

## Integration Points

### App Layout

Sentry is initialized in `app/_layout.tsx`:

```typescript
<SentryProvider>
  <AnalyticsProvider>
    {/* Other providers */}
  </AnalyticsProvider>
</SentryProvider>
```

### User Context

User information is automatically synced from:
- `AuthContext`: Session and authentication data
- `UserContext`: Profile and app-specific user data

### Error Filtering

The configuration includes filters to:
- Remove test errors in development
- Filter sensitive navigation breadcrumbs
- Prevent duplicate error reporting

## Best Practices

1. **Use Context**: Always provide relevant context when capturing errors
2. **Breadcrumbs**: Add breadcrumbs for user actions to create a trail
3. **Tags**: Use tags for filtering and grouping errors
4. **User Context**: Ensure user information is set for better debugging
5. **Performance**: Use transactions for measuring performance-critical operations

## Debug Symbols

For complete stack traces, you'll need to upload debug symbols:

### iOS
- Upload dSYM files to Sentry
- Configure Xcode build settings for symbol upload

### Android
- Upload ProGuard mapping files
- Configure Gradle for automatic upload

### Source Maps
- Upload source maps for JavaScript errors
- Configure build process for automatic upload

## Monitoring

Check your Sentry dashboard for:
- Error rates and trends
- Performance metrics
- User session replays
- Release health

## Troubleshooting

### Common Issues

1. **Errors not appearing**: Check DSN configuration and network connectivity
2. **Missing user context**: Verify user is logged in and context is set
3. **Performance data missing**: Check sampling rates and transaction configuration

### Debug Mode

Enable debug mode in development to see detailed logs:

```typescript
DEBUG: __DEV__,
```

## Security

- PII is controlled via `sendDefaultPii` setting
- Sensitive data is filtered in `beforeBreadcrumb` and `beforeSend` hooks
- User consent should be obtained for session replay in production

## Files Created/Modified

### New Files
- `lib/sentry/config.ts`
- `lib/sentry/service.ts`
- `lib/sentry/index.ts`
- `contexts/SentryContext.tsx`
- `hooks/useSentryErrorBoundary.ts`
- `components/SentryTest.tsx`

### Modified Files
- `app/_layout.tsx` - Added SentryProvider
- `app/(tabs)/settings.tsx` - Added SentryTest component
- `lib/analytics/service.ts` - Added Sentry error capture
- `package.json` - Added @sentry/react-native dependency

## Next Steps

### Debug Symbols (Optional)
For complete stack traces, consider uploading debug symbols:

#### iOS
- Upload dSYM files to Sentry
- Configure Xcode build settings

#### Android
- Upload ProGuard mapping files
- Configure Gradle for automatic upload

#### Source Maps
- Upload source maps for JavaScript errors
- Configure build process for automatic upload

### Monitoring Setup
1. Set up alerts in Sentry dashboard
2. Configure release tracking
3. Set up performance monitoring alerts
4. Configure session replay privacy settings

## Conclusion

The Sentry.io implementation is now complete and ready for use. The modular design ensures it integrates seamlessly with your existing codebase while providing comprehensive error tracking, performance monitoring, and debugging capabilities.

The implementation follows React Native and Sentry best practices, includes proper error handling, and provides both automatic and manual integration options. You can now monitor your app's health, track errors, and improve user experience with detailed insights from Sentry. 