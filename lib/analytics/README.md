# Analytics Setup Guide

This guide explains how to set up and use Amplitude analytics in your Tmaxx app.

## Setup

### 1. Environment Variables

Add your Amplitude API key to your `.env` file:

```env
EXPO_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_api_key_here
```

### 2. Get Your Amplitude API Key

1. Go to [Amplitude](https://amplitude.com/) and create an account
2. Create a new project for your app
3. Copy the API key from your project settings
4. Add it to your `.env` file

## Usage

### Basic Event Tracking

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';

function MyComponent() {
  const { track } = useAnalytics();

  const handleButtonClick = () => {
    track(ANALYTICS_EVENTS.BUTTON_CLICKED, {
      button_name: 'create_habit',
      screen: 'home',
    });
  };

  return <Button onPress={handleButtonClick}>Create Habit</Button>;
}
```

### Screen Tracking

#### Option 1: Using the hook

```typescript
import { useScreenTracking } from '@/components/analytics/withScreenTracking';
import { SCREEN_NAMES } from '@/lib/analytics';

function HomeScreen() {
  useScreenTracking(SCREEN_NAMES.HOME);

  return <View>...</View>;
}
```

#### Option 2: Using the HOC

```typescript
import { withScreenTracking } from '@/components/analytics/withScreenTracking';
import { SCREEN_NAMES } from '@/lib/analytics';

function HomeScreen() {
  return <View>...</View>;
}

export default withScreenTracking(HomeScreen, SCREEN_NAMES.HOME);
```

### User Properties

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { USER_PROPERTIES } from '@/lib/analytics';

function OnboardingComplete() {
  const { setUserProperties } = useAnalytics();

  const completeOnboarding = () => {
    setUserProperties({
      [USER_PROPERTIES.HAS_COMPLETED_ONBOARDING]: true,
      [USER_PROPERTIES.JOIN_DATE]: new Date().toISOString(),
    });
  };

  return <Button onPress={completeOnboarding}>Complete</Button>;
}
```

### User Identification

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';

function LoginScreen() {
  const { setUserId, identify } = useAnalytics();

  const handleLogin = async (userData) => {
    // Set user ID for tracking
    setUserId(userData.id);
    
    // Set user properties
    identify({
      email: userData.email,
      subscription_status: userData.subscriptionStatus,
      user_type: userData.userType,
    });
  };

  return <LoginForm onLogin={handleLogin} />;
}
```

### Error Tracking

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';

function ErrorBoundary() {
  const { trackError } = useAnalytics();

  const handleError = (error: Error) => {
    trackError(error, {
      component: 'ErrorBoundary',
      user_action: 'app_crash',
    });
  };

  // ... error boundary logic
}
```

## Predefined Events

The analytics system includes predefined events for common actions:

### App Lifecycle
- `APP_LAUNCHED`
- `APP_BACKGROUNDED`
- `APP_FOREGROUNDED`

### Authentication
- `LOGIN_ATTEMPTED`
- `LOGIN_SUCCESSFUL`
- `LOGIN_FAILED`
- `SIGNUP_ATTEMPTED`
- `SIGNUP_SUCCESSFUL`
- `SIGNUP_FAILED`
- `LOGOUT`

### Onboarding
- `ONBOARDING_STARTED`
- `ONBOARDING_STEP_COMPLETED`
- `ONBOARDING_COMPLETED`
- `ONBOARDING_SKIPPED`

### Habits
- `HABIT_CREATED`
- `HABIT_UPDATED`
- `HABIT_DELETED`
- `HABIT_COMPLETED`
- `HABIT_SKIPPED`
- `HABIT_STREAK_UPDATED`

### Squads
- `SQUAD_CREATED`
- `SQUAD_JOINED`
- `SQUAD_LEFT`
- `SQUAD_INVITE_SENT`
- `SQUAD_INVITE_ACCEPTED`
- `SQUAD_INVITE_DECLINED`

### Progress
- `PROGRESS_VIEWED`
- `PROGRESS_SHARED`

### Settings
- `SETTINGS_CHANGED`
- `PROFILE_UPDATED`

### Subscriptions
- `SUBSCRIPTION_STARTED`
- `SUBSCRIPTION_CANCELLED`
- `SUBSCRIPTION_RENEWED`
- `PAYMENT_FAILED`

## Predefined Screen Names

- `LOGIN`
- `SIGNUP`
- `HOME`
- `PLAN`
- `PROGRESS`
- `SQUAD`
- `SETTINGS`
- `ONBOARDING_WELCOME`
- `ONBOARDING_ACCOUNT`
- `ONBOARDING_HEIGHT_WEIGHT`
- `ONBOARDING_SLEEP`
- `ONBOARDING_RESULTS`

## User Properties

- `HAS_COMPLETED_ONBOARDING`
- `SUBSCRIPTION_STATUS`
- `USER_TYPE`
- `JOIN_DATE`
- `TOTAL_HABITS`
- `ACTIVE_HABITS`
- `LONGEST_STREAK`
- `CURRENT_STREAK`
- `SQUAD_MEMBER`
- `SQUAD_OWNER`

## Best Practices

1. **Use predefined events**: Always use the predefined events from `ANALYTICS_EVENTS` for consistency
2. **Include relevant properties**: Add meaningful properties to your events for better insights
3. **Track user actions**: Track important user actions like button clicks, form submissions, etc.
4. **Set user properties**: Use `setUserProperties` to track user characteristics
5. **Error tracking**: Always track errors with context for debugging
6. **Screen tracking**: Use screen tracking to understand user navigation patterns

## Development vs Production

- In development, analytics events are logged to the console for debugging
- In production, events are sent to Amplitude
- The analytics service automatically handles environment detection

## Testing

To test analytics in development:

1. Check the console for analytics event logs
2. Verify events are being sent to Amplitude dashboard
3. Use Amplitude's debug mode for real-time event viewing

## Troubleshooting

### Analytics not initialized
- Check that your Amplitude API key is set in `.env`
- Verify the API key is correct
- Check console for initialization errors

### Events not tracking
- Ensure you're using the `useAnalytics` hook within the `AnalyticsProvider`
- Check that analytics is initialized before tracking events
- Verify event names and properties are correct

### User properties not updating
- Use `identify()` for setting user properties
- Ensure user ID is set before setting properties
- Check Amplitude dashboard for property updates 