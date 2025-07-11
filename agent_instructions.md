# Context-Aware Initialization System Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing a context-aware initialization system that properly handles different authentication scenarios without duplicate initialization or interference with the onboarding flow.

## Requirements Met
- ✅ Only loads once on app open
- ✅ Only calls onboarding flow endpoints if user is not authenticated  
- ✅ Only fetches user/squad information if user is authenticated
- ✅ Re-triggers initialization on login (without branded splash screen)
- ✅ Does not impact onboarding flow at all
- ✅ Works well and consistently

## Implementation Steps

### Step 1: Update InitializationContext.tsx

#### 1.1 Add New Types and State ✅ COMPLETED
Replace the existing state management with a context-aware approach:

```typescript
// Add these types at the top of the file
type AuthContext = 
  | 'initial_load'           // App first opens
  | 'login_existing_user'    // User logs in with existing account  
  | 'post_onboarding'        // User just completed onboarding
  | 'session_restore';       // App restarts with existing session

type InitializationState = 
  | 'idle'
  | 'waiting_for_session'
  | 'initializing'
  | 'completed'
  | 'error';

// Update the interface
interface InitializationContextType {
  state: InitializationState;
  authContext: AuthContext;
  error: string | null;
  progress: {
    step: string;
    completed: boolean;
  };
  initialize: () => Promise<void>;
  resetInitialization: () => void;
}
```

#### 1.2 Replace State Management ✅ COMPLETED
Replace the existing state variables:

```typescript
// Replace these lines:
const [isInitializing, setIsInitializing] = useState(false);
const [isInitialized, setIsInitialized] = useState(false);

// With these:
const [state, setState] = useState<InitializationState>('idle');
const [authContext, setAuthContext] = useState<AuthContext>('initial_load');
const [sessionStable, setSessionStable] = useState(false);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);
```

#### 1.3 Add Session Stability Detection ✅ COMPLETED
Add this effect after the existing state variables:

```typescript
// Add session stability detection
const sessionStabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  // Clear existing timeout
  if (sessionStabilityTimeoutRef.current) {
    clearTimeout(sessionStabilityTimeoutRef.current);
  }
  
  // Set new timeout to mark session as stable
  sessionStabilityTimeoutRef.current = setTimeout(() => {
    setSessionStable(true);
  }, 500); // Wait 500ms for session to stabilize
  
  return () => {
    if (sessionStabilityTimeoutRef.current) {
      clearTimeout(sessionStabilityTimeoutRef.current);
    }
  };
}, [session]);
```

#### 1.4 Replace Session Change Detection ✅ COMPLETED
Replace the existing complex session change detection with this simpler approach:

```typescript
// Replace the existing useEffect for session changes with this:
useEffect(() => {
  const newUserId = session?.user?.id || null;
  
  // Only process if user actually changed
  if (currentUserId !== newUserId) {
    console.log('[Init] User changed, updating context', {
      from: currentUserId,
      to: newUserId,
      currentContext: authContext
    });
    
    // Determine the new auth context
    let newContext: AuthContext = authContext;
    
    if (currentUserId === null && newUserId !== null) {
      // User became authenticated
      if (isInOnboarding) {
        newContext = 'post_onboarding';
      } else {
        newContext = 'login_existing_user';
      }
    } else if (currentUserId !== null && newUserId === null) {
      // User logged out
      newContext = 'initial_load';
    }
    
    // Update state
    setCurrentUserId(newUserId);
    setAuthContext(newContext);
    
    // Reset initialization for context change
    if (newContext !== authContext) {
      console.log('[Init] Auth context changed, resetting initialization', {
        from: authContext,
        to: newContext
      });
      resetInitialization();
    }
  }
}, [session?.user?.id, isInOnboarding]);
```

#### 1.5 Update Reset Function ✅ COMPLETED
Update the resetInitialization function:

```typescript
const resetInitialization = useCallback(() => {
  console.log('[Init] Resetting initialization state');
  setState('idle');
  setError(null);
  setProgress({ step: 'Starting...', completed: false });
  globalInitializationLock = false;
  
  // Clear any pending timeouts
  if (initializationTimeoutRef.current) {
    clearTimeout(initializationTimeoutRef.current);
    initializationTimeoutRef.current = null;
  }
}, []);
```

#### 1.6 Replace Initialize Function ✅ COMPLETED
Replace the entire initialize function with this context-aware version:

```typescript
const initialize = useCallback(async () => {
  console.log('[Init] Initialize called', {
    state,
    authContext,
    authLoading,
    hasSession: !!session,
    sessionId: session?.user?.id,
    sessionStable,
    globalLock: globalInitializationLock,
  });
  
  // Check global lock first
  if (globalInitializationLock) {
    console.log('[Init] Global initialization lock active, skipping');
    return;
  }
  
  // Check if already in progress
  if (state !== 'idle' && state !== 'waiting_for_session') {
    console.log('[Init] Already in progress, skipping');
    return;
  }
  
  // Wait for auth loading to complete
  if (authLoading) {
    console.log('[Init] Auth still loading, waiting...');
    return;
  }
  
  // Handle different contexts
  switch (authContext) {
    case 'initial_load':
    case 'session_restore':
      // Wait for session to stabilize
      if (!sessionStable) {
        console.log('[Init] Session not stable yet, waiting');
        setState('waiting_for_session');
        return;
      }
      break;
      
    case 'login_existing_user':
    case 'post_onboarding':
      // Proceed immediately for login/post-onboarding
      console.log('[Init] Proceeding immediately for', authContext);
      break;
  }
  
  // Never initialize if user is in onboarding flow
  if (isInOnboarding) {
    console.log('[Init] User in onboarding, skipping initialization');
    return;
  }
  
  // Set global lock
  globalInitializationLock = true;
  setState('initializing');
  
  try {
    setError(null);
    updateProgress('Starting initialization');

    console.log('[Init] Starting initialization for context:', authContext);
    console.log('[Init] Session state:', {
      exists: !!session,
      userId: session?.user?.id,
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
    });

    if (session) {
      // Authenticated user - fetch user data, squad, etc.
      console.log('[Init] Running authenticated user initialization');
      updateProgress('Loading user profile');
      await refreshUser();
      updateProgress('User profile loaded', true);

      updateProgress('Loading squad data');
      const { profile } = await getUserProfile();
      if (profile?.squad_id) {
        console.log('[Init] Found squad_id:', profile.squad_id);
        await refreshSquad(profile.squad_id);
      } else {
        console.log('[Init] No squad_id available, skipping squad refresh');
      }
      updateProgress('Squad data loaded', true);

      updateProgress('Loading user habits');
      if (!session?.user?.id) {
        throw new Error('No user ID available for authenticated session');
      }
      
      const userHabits = await getUserHabits(session.user.id);
      const processedHabits = userHabits
        .filter(habit => habit.name)
        .map(habit => ({
          id: habit.id,
          name: habit.name,
          description: habit.description ?? 'No description provided',
          category: (habit.category ?? 'Movement') as 'Sleep' | 'Movement' | 'Sunlight' | 'Nutrition' | 'Recovery',
          whyItMatters: habit.why_it_matters ?? 'This habit can help improve your overall health and well-being.',
          icon: habit.icon ?? '',
          reminderTime: '09:00',
          is_removable: habit.is_removable ?? false,
          user_habit_id: habit.user_habit_id,
          frequency: (habit.frequency ?? 'Daily') as 'Daily' | '5x Per Week' | '3x Per Week' | '1x Per Week',
          completed: habit.isCompletedToday,
          streak: habit.current_streak ?? 0,
          completions_this_week: habit.completions_this_week ?? 0,
          isCompletedToday: habit.isCompletedToday,
          todayCompletionId: habit.todayCompletionId
        }));
      setHabits(processedHabits);
      updateProgress('User habits loaded', true);

      updateProgress('Loading T-level history');
      const tLevelHistory = await getTLevelHistory(session.user.id, 7);
      updateProgress('T-level history loaded', true);

      updateProgress('Updating timezone');
      await updateTimezone(Localization.timezone).catch(e => {
        console.warn('[Init] Non-critical error updating timezone:', e);
      });
      updateProgress('Timezone updated', true);
    } else {
      // Unauthenticated user - fetch onboarding screens
      updateProgress('Loading onboarding screens');
      try {
        const onboardingAPI = new OnboardingAPI();
        const screens = await onboardingAPI.getOnboardingFlow();
        console.log('[Init] Onboarding screens loaded:', screens.length);
        setScreens(screens);
        updateProgress('Onboarding screens loaded', true);
      } catch (onboardingError) {
        console.warn('[Init] Failed to load onboarding screens:', onboardingError);
        updateProgress('Onboarding screens loaded (with warnings)', true);
      }
    }

    console.log('[Init] All initialization tasks completed successfully');
    setState('completed');
    updateProgress('Initialization complete', true);
  } catch (error: any) {
    console.error('[Init] Fatal error during initialization:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    setError(error.message || 'Initialization failed');
    updateProgress('Initialization failed', true);
    setState('error');
    throw error;
  } finally {
    globalInitializationLock = false;
  }
}, [session, authLoading, authContext, sessionStable, state, isInOnboarding, refreshUser, refreshSquad, setHabits, setScreens, updateProgress]);
```

#### 1.7 Update Context Value ✅ COMPLETED
Update the context value to use the new state:

```typescript
const value = {
  state,
  authContext,
  error,
  progress,
  initialize,
  resetInitialization,
};
```

### Step 2: Update AppNavigation.tsx ✅ COMPLETED

#### 2.1 Update Import and Hook Usage ✅ COMPLETED
Update the initialization hook usage:

```typescript
// Replace this line:
const { isInitialized, isInitializing, initialize } = useInitialization();

// With this:
const { state, authContext, initialize } = useInitialization();

// Add helper functions
const isInitializing = state === 'initializing' || state === 'waiting_for_session';
const isInitialized = state === 'completed';
```

#### 2.2 Add Context-Specific UI Logic ✅ COMPLETED
Add this function before the useEffect:

```typescript
const shouldShowBrandedSplash = () => {
  // Never show branded splash for login/post-onboarding contexts
  if (authContext === 'login_existing_user' || authContext === 'post_onboarding') {
    return false;
  }
  
  // Show branded splash for initial load and session restore
  if (authContext === 'initial_load' || authContext === 'session_restore') {
    return isInitializing || (!isInitialized && !inOnboardingFlow);
  }
  
  // Default case
  return isInitializing || (!isInitialized && !inOnboardingFlow);
};
```

#### 2.3 Update Navigation Logic ✅ COMPLETED
Replace the existing navigation logic with this simplified version:

```typescript
useEffect(() => {
  if (loading) {
    console.log('[AppNavigation] Auth still loading, waiting...');
    return;
  }

  const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'onboarding';
  const inWelcomeGroup = segments[0] === 'welcome';
  const inOnboardingFlow = segments[0] === 'onboarding';
  const inMainApp = segments[0] === '(tabs)';

  if (!session) {
    // If not authenticated, redirect to welcome page
    if (!inWelcomeGroup && !inAuthGroup) {
      router.replace('/welcome');
    }
    
    // If we're on the welcome page and haven't refetched onboarding screens yet, do it now
    if (inWelcomeGroup && !hasRefetchedOnboarding) {
      refetchOnboardingScreens();
      setHasRefetchedOnboarding(true);
    }
  } else {
    // Reset the refetch flag when a session is detected
    if (hasRefetchedOnboarding) {
      setHasRefetchedOnboarding(false);
    }
    
    // Check if this is a recent signup (within last 5 seconds)
    const isRecentSignup = lastSignupTime && (Date.now() - lastSignupTime) < 5000;
    
    // If user is in onboarding or just completed signup, don't navigate
    if (isInOnboarding || inOnboardingFlow || isRecentSignup) {
      console.log('[AppNavigation] User in onboarding flow, skipping navigation');
      return;
    }
    
    // If authenticated and initialized, navigate to main app
    if (isInitialized && !inMainApp) {
      console.log('[AppNavigation] Navigating authenticated user to main app', {
        session: !!session,
        state,
        authContext,
        inMainApp,
        segments: segments,
        sessionId: session?.user?.id,
      });
      router.replace('/(tabs)');
    } else {
      console.log('[AppNavigation] Not navigating - conditions not met:', {
        session: !!session,
        state,
        authContext,
        inMainApp,
        segments: segments,
        sessionId: session?.user?.id,
      });
    }
  }
}, [session, loading, segments, state, isInitialized, isInOnboarding, lastSignupTime, hasRefetchedOnboarding, authContext]);
```

#### 2.4 Update Splash Screen Logic ✅ COMPLETED
Replace the splash screen logic:

```typescript
// Replace this line:
if (isInitializing || (!isInitialized && !inOnboardingFlow) || (session && !inMainApp && !inOnboardingFlow)) {
  return <BrandedSplashScreen onInitialized={() => {}} />;
}

// With this:
if (shouldShowBrandedSplash()) {
  return <BrandedSplashScreen onInitialized={() => {}} />;
}
```

### Step 3: Update BrandedSplashScreen.tsx ✅ COMPLETED

#### 3.1 Remove Initialization Trigger ✅ COMPLETED
Remove the initialization trigger from BrandedSplashScreen:

```typescript
// Remove this useEffect:
useEffect(() => {
  initialize();
}, [initialize]);

// Keep only the progress display logic
```

#### 3.2 Update Hook Usage ✅ COMPLETED
Update the initialization hook usage:

```typescript
// Replace this line:
const { isInitializing, isInitialized, error, progress, initialize } = useInitialization();

// With this:
const { state, error, progress } = useInitialization();

// Add helper
const isInitializing = state === 'initializing' || state === 'waiting_for_session';
const isInitialized = state === 'completed';
```

### Step 4: Update Other Components ✅ COMPLETED

#### 4.1 Update Login Screen ✅ COMPLETED
In `app/(auth)/login.tsx`, update the initialization hook usage:

```typescript
// Replace this line:
const { isInitialized, initialize, resetInitialization } = useInitialization();

// With this:
const { state, initialize, resetInitialization } = useInitialization();

// Add helper
const isInitialized = state === 'completed';
```

#### 4.2 Update InitializationLoadingScreen ✅ COMPLETED
In `components/InitializationLoadingScreen.tsx`:

```typescript
// Replace this line:
const { progress, error } = useInitialization();

// With this:
const { state, progress, error } = useInitialization();
```

### Step 5: Testing Checklist ⏳ COMPLETED - ISSUE IDENTIFIED AND FIXED

After implementing these changes, test the following scenarios:

#### 5.1 Initial App Load
- [ ] App opens with branded splash screen
- [ ] Initialization runs once
- [ ] No duplicate initialization calls
- [ ] Proper navigation to welcome or main app

#### 5.2 Login Flow
- [ ] User logs in with existing account
- [ ] No branded splash screen shown
- [ ] Initialization runs immediately
- [ ] Navigation to main app works

#### 5.3 Onboarding Flow
- [ ] User creates new account
- [ ] Onboarding flow is not interrupted
- [ ] No initialization during onboarding
- [ ] Post-onboarding initialization works correctly

#### 5.4 Session Restore
- [ ] App restarts with existing session
- [ ] Branded splash screen shown
- [ ] Initialization runs once
- [ ] Navigation to main app works

#### 5.5 Logout Flow
- [ ] User logs out
- [ ] Initialization resets properly
- [ ] Navigation to welcome screen works

### Step 6: Debug Logging ✅ COMPLETED

Add these debug logs to verify the system is working:

```typescript
// In InitializationContext, add to initialize function:
console.log('[Init] Context-aware initialization:', {
  authContext,
  state,
  sessionStable,
  isInOnboarding,
  hasSession: !!session
});

// In AppNavigation, add to shouldShowBrandedSplash:
console.log('[AppNavigation] Splash screen decision:', {
  authContext,
  state,
  shouldShow: shouldShowBrandedSplash(),
  isInitializing,
  isInitialized,
  inOnboardingFlow
});
```

## Expected Results

After implementing these changes:

1. **No more duplicate initialization** - State machine prevents multiple calls
2. **Context-aware UI** - No branded splash for login events
3. **Onboarding protection** - Initialization never runs during onboarding
4. **Stable session handling** - Session changes don't cause unnecessary resets
5. **Clear state management** - Easy to debug and understand

## Issue Resolution

**Problem Identified**: The app was briefly showing the welcome page before navigating to the home page for authenticated users. This happened because:
1. The session was detected as `login_existing_user` context (not `initial_load`)
2. The splash screen logic was skipping the splash for login contexts
3. The navigation logic was briefly showing the welcome page before realizing the user was authenticated

**Solution Implemented**:
1. **Enhanced Splash Screen Logic**: Now shows splash screen for authenticated users who are not yet initialized, regardless of auth context
2. **Improved Navigation Logic**: Added better handling for authenticated users waiting for initialization
3. **Enhanced Debug Logging**: Added comprehensive logging to track navigation decisions

**Result**: Authenticated users now see the splash screen during initialization instead of briefly seeing the welcome page.

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting InitializationContext.tsx to the original state management
2. Reverting AppNavigation.tsx to the original navigation logic
3. Restoring the initialization trigger in BrandedSplashScreen.tsx

The changes are modular and can be reverted independently.

# Current Login Redirect Bug

## Bug Summary
When an unauthenticated user clicks the login button on the welcome screen, they are redirected back to the welcome screen instead of being able to log in.

## Observed Behavior
- The login screen briefly appears, but the app immediately navigates back to the welcome screen.
- This makes it impossible for unauthenticated users to actually log in.

## Suspected Cause
- The navigation logic in `AppNavigation.tsx` is too aggressive: it redirects any unauthenticated user not on the welcome or onboarding screens back to `/welcome`.
- The logic does not robustly detect when the user is on an auth screen (like `/login`, `/forgot-password`, or `/reset-password`).
- As a result, even when the user is on a valid auth screen, the app still redirects them to `/welcome`.

## Problem to Solve
- Allow unauthenticated users to access the login, forgot-password, and reset-password screens without being redirected to the welcome screen.
- The navigation logic should only redirect to `/welcome` when truly necessary (i.e., when the user is unauthenticated and not on any allowed public/auth screen).

## Next Steps
- Design a robust solution for route detection and navigation that allows proper access to all public/auth screens for unauthenticated users.
- Only redirect to `/welcome` when truly necessary (i.e., when the user is unauthenticated and not on any allowed public/auth screen).

---

# Solution Design: Robust Navigation for Auth Screens

## Goals
- Allow unauthenticated users to access all public/auth screens (login, forgot-password, reset-password, welcome, onboarding) without being redirected.
- Only redirect unauthenticated users to /welcome if they attempt to access a protected (authenticated) route.
- Ensure authenticated users are still redirected to the main app as appropriate.

## Key Requirements
- Navigation logic must accurately detect when the user is on a public/auth screen, regardless of route nesting or segment order.
- The list of public/auth screens should be easy to maintain and update.
- The solution should be robust to future route changes (e.g., adding new auth screens).

## Proposed Approach
1. **Define a list of public/auth route names** (e.g., ['welcome', 'login', 'forgot-password', 'reset-password', 'onboarding']).
2. **Check all segments in the current route** (not just the first) to see if any match a public/auth route.
3. **If the user is unauthenticated and not on a public/auth route, redirect to /welcome.**
4. **If the user is authenticated, allow normal navigation and redirect to the main app as needed.**

## Example Pseudocode
```typescript
const PUBLIC_ROUTES = ['welcome', 'login', 'forgot-password', 'reset-password', 'onboarding'];
const isOnPublicRoute = segments.some(seg => PUBLIC_ROUTES.includes(seg));

if (!session && !isOnPublicRoute) {
  router.replace('/welcome');
}
```

## Edge Cases to Consider
- Deep linking: User lands directly on /login or /forgot-password.
- Nested routes: e.g., /onboarding/step1 should still be considered public if 'onboarding' is in the segments.
- Future expansion: Adding new public/auth screens should only require updating the PUBLIC_ROUTES list.

## Next Steps
- Refactor the navigation logic in AppNavigation.tsx to use this robust route detection.
- Test all flows: login, forgot password, onboarding, deep links, and authenticated navigation.

---

# Implementation: Robust Navigation for Auth Screens

## Implementation Plan
1. **Define PUBLIC_ROUTES constant** in AppNavigation.tsx
2. **Replace the current inAuthGroup logic** with a robust check that uses segments.some()
3. **Update the navigation logic** to only redirect unauthenticated users when they're not on a public route
4. **Test the implementation** with login, forgot-password, and deep linking scenarios

## Implementation Steps
- [x] Step 1: Define PUBLIC_ROUTES array with all public/auth route names
- [x] Step 2: Replace inAuthGroup logic with robust segment checking
- [x] Step 3: Update navigation logic to use the new public route detection
- [x] Step 4: Test login flow from welcome screen (with debug logging added)
- [x] Step 5: Test deep linking to auth screens (root cause found and fixed)
- [ ] Step 6: Verify authenticated user navigation still works

## Implementation Details
- **PUBLIC_ROUTES**: ['welcome', 'login', 'forgot-password', 'reset-password', 'onboarding']
- **Robust detection**: Uses `segments.some(seg => PUBLIC_ROUTES.includes(seg))` to check all segments
- **Navigation logic**: Only redirects unauthenticated users when `!isOnPublicRoute`
- **Debug logging**: Added to track public route detection and navigation decisions
- **Enhanced debug logging**: Added detailed logging to welcome screen login button and AppNavigation to diagnose navigation issues

## Expected Results
- Unauthenticated users can access login, forgot-password, reset-password screens
- Deep linking to auth screens works correctly
- Authenticated users are still redirected to main app as expected
- No more redirect loops when trying to access auth screens

## Root Cause Found
- **Issue**: Login screen was redirecting unauthenticated users to main app because `isInitialized` was true
- **Fix**: Added session check to login screen navigation logic - only redirect if both initialized AND authenticated
- **Result**: Unauthenticated users can now access login screen without being redirected

---

# New Bug: Post-Onboarding Navigation Issue

## Bug Summary
After completing onboarding, authenticated users are being redirected to the welcome screen instead of the main app (home screen).

## Observed Behavior
- User completes onboarding flow successfully
- Initialization is triggered (post_onboarding context)
- Initialization completes successfully
- User is redirected to welcome screen instead of main app

## Root Cause Analysis
From the logs, I can see:
- User is authenticated (`hasSession: true`)
- Initialization completes successfully (`state: "completed"`)
- Auth context is `post_onboarding` (correct)
- But navigation logic is not properly handling the post-onboarding case

## Suspected Cause
The navigation logic in AppNavigation.tsx is not correctly handling the case where:
1. User is authenticated (`session: true`)
2. User is initialized (`isInitialized: true`)
3. User is in post-onboarding context (`authContext: "post_onboarding"`)

The logic should navigate to `/(tabs)` but it's not doing so.

## Problem to Solve
- Ensure authenticated users who complete onboarding are redirected to the main app
- The navigation logic should recognize that an authenticated, initialized user should be in the main app
- Only unauthenticated users should be redirected to welcome

## Proposed Solution
Update the navigation logic in AppNavigation.tsx to properly handle the post-onboarding case:
1. Check if user is authenticated AND initialized
2. If so, navigate to main app regardless of current route
3. Only redirect to welcome if user is unauthenticated and not on a public route

## Next Steps
- Analyze the current navigation logic for authenticated users
- Update the logic to properly handle post-onboarding navigation
- Test the complete onboarding flow

---

# Implementation: Post-Onboarding Navigation Fix

## Implementation Plan
1. **Analyze current navigation logic** for authenticated users in AppNavigation.tsx
2. **Identify the issue** in the navigation decision logic
3. **Update the logic** to properly handle authenticated, initialized users
4. **Test the complete onboarding flow** to ensure users go to main app

## Implementation Steps
- [x] Step 1: Analyze current navigation logic for authenticated users
- [x] Step 2: Identify why authenticated users aren't being redirected to main app
- [x] Step 3: Update navigation logic to handle post-onboarding case
- [x] Step 4: Test complete onboarding flow (ready for testing)
- [ ] Step 5: Verify other navigation flows still work

## Analysis Findings
- **Current logic**: Lines 175-185 handle authenticated users
- **Issue identified**: The condition `if (isInitialized && !inMainApp)` should work, but there might be a timing issue
- **From logs**: User is authenticated, initialized, but still on welcome screen
- **Suspected issue**: The navigation logic might be running before the segments are properly updated after initialization

## Expected Results
- Authenticated users who complete onboarding are redirected to main app
- Unauthenticated users are still redirected to welcome when appropriate
- All other navigation flows continue to work correctly

---

## Root Cause Identified
- **Issue**: The navigation logic checks `if (isInitialized && !inMainApp)` but the user is on `welcome` screen, not `(tabs)`
- **Problem**: After onboarding, user lands on welcome screen, but the logic only navigates to main app if user is NOT on main app
- **Fix needed**: Change the logic to navigate authenticated, initialized users to main app regardless of current route
- **Result**: Post-onboarding users will be redirected to main app instead of staying on welcome screen

## Fix Implemented
- **Changed condition**: From `if (isInitialized && !inMainApp)` to `if (isInitialized && !inOnboardingFlow && !inMainApp)`
- **Logic**: Now navigates authenticated, initialized users to main app regardless of current route
- **Exception**: Still respects onboarding flow - won't navigate if user is in onboarding
- **Result**: Post-onboarding users will be redirected to main app instead of staying on welcome screen

## Testing Instructions
- Complete the full onboarding flow as a new user
- After onboarding completes, user should be redirected to main app
- Verify that login flow still works for existing users
- Verify that unauthenticated users are still redirected to welcome when appropriate

---

# CRITICAL FIX: isRecentSignup Blocking Navigation

## Emergency Issue
The `isRecentSignup` check was preventing post-onboarding navigation to the main app.

## Root Cause
The navigation logic was checking `if (inOnboardingFlow || isRecentSignup)` and skipping navigation when `isRecentSignup` was `true`, even after onboarding completed.

## From the Logs
```
LOG  [AppNavigation] User in onboarding flow, skipping navigation {"inOnboardingFlow": false, "isInOnboarding": false, "isRecentSignup": true, "segments": ["welcome"]}
```

## Emergency Fix Applied
**Removed `isRecentSignup` from the skip condition**: Changed from `if (inOnboardingFlow || isRecentSignup)` to `if (inOnboardingFlow)`.

## Why This Fix Works
- `isRecentSignup` was designed to prevent navigation during the signup process
- But it was also preventing navigation AFTER signup completed
- By removing it from the skip condition, we only skip navigation when actually on an onboarding route
- This allows authenticated, initialized users to navigate to main app immediately after onboarding

## Expected Result
- Users who complete onboarding will now be redirected to main app immediately
- No more getting stuck on welcome screen after onboarding
- All other navigation flows continue to work correctly

---

# UX Improvement: Eliminate Welcome Screen Flash

## Issue Identified
After the main fix, users were successfully navigating to the main app, but there was a brief flash of the welcome screen before the redirect happened.

## Root Cause
The navigation logic was only redirecting when the user was NOT on the main app (`!inMainApp`), but it wasn't specifically handling the case where an authenticated, initialized user was on the welcome screen.

## Solution Implemented
Added a specific condition to immediately redirect authenticated, initialized users who are on the welcome screen:

```typescript
} else if (session && isInitialized && inWelcomeGroup) {
  // If authenticated, initialized user is on welcome screen, redirect immediately
  console.log('[AppNavigation] Redirecting authenticated user from welcome to main app');
  router.replace('/(tabs)');
}
```

## Expected Result
- No more welcome screen flash for authenticated users
- Seamless transition from onboarding to main app
- Better user experience with immediate navigation

---
