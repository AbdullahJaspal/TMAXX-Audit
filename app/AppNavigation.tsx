import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import { useInitialization } from '@/contexts/InitializationContext';
import { refetchOnboardingScreens } from '@/lib/services/logoutService';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import BrandedSplashScreen from '@/components/BrandedSplashScreen';

export function AppNavigation() {
  const { session, loading, isInOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { addBreadcrumb } = useSentry();
  const [lastSignupTime, setLastSignupTime] = useState<number | null>(null);
  const [hasRefetchedOnboarding, setHasRefetchedOnboarding] = useState(false);
  
  // Update initialization hook usage
  const { state, authContext, initialize } = useInitialization();

  // Add helper functions
  const isInitializing = state === 'initializing' || state === 'waiting_for_session';
  const isInitialized = state === 'completed';

  // Add initialization trigger
  useEffect(() => {
    console.log('[AppNavigation] Initialization trigger check:', {
      loading,
      state,
      authContext,
      hasSession: !!session,
      sessionId: session?.user?.id
    });
    
    if (!loading && (state === 'idle' || state === 'waiting_for_session')) {
      console.log('[AppNavigation] Triggering initialization');
      initialize();
    }
  }, [loading, state, initialize, authContext, session]);

  // Force initialization on first load if authenticated
  useEffect(() => {
    if (!loading && session && state === 'idle') {
      console.log('[AppNavigation] Force triggering initialization for authenticated user');
      initialize();
    }
  }, [loading, session, state, initialize]);

  // Define all public routes that unauthenticated users can access
  const PUBLIC_ROUTES = ['welcome', 'login', 'forgot-password', 'reset-password', 'onboarding'];
  
  // Check if user is on any public route (robust check across all segments)
  const isOnPublicRoute = (segments as string[]).some(seg => PUBLIC_ROUTES.includes(seg));
  
  // Legacy variables for backward compatibility
  const inAuthGroup = isOnPublicRoute;
  const inWelcomeGroup = (segments as string[])[0] === 'welcome';
  const inOnboardingFlow = (segments as string[])[0] === 'onboarding';
  const inMainApp = (segments as string[])[0] === '(tabs)';

  // Add context-specific UI logic
  const shouldShowBrandedSplash = () => {
    console.log('[AppNavigation] Splash screen decision:', {
      authContext,
      state,
      isInitializing,
      isInitialized,
      inOnboardingFlow,
      inWelcomeGroup,
      inMainApp,
      hasSession: !!session,
      sessionId: session?.user?.id
    });
    
    // Show splash screen for authenticated users who are not yet initialized
    if (session && !isInitialized && !inOnboardingFlow) {
      console.log('[AppNavigation] Showing splash for authenticated user waiting for initialization');
      return true;
    }
    
    // Never show branded splash for login/post-onboarding contexts (when already initialized)
    if (authContext === 'login_existing_user' || authContext === 'post_onboarding') {
      console.log('[AppNavigation] Not showing splash - login/post-onboarding context');
      return false;
    }
    
    // Show branded splash for initial load and session restore
    if (authContext === 'initial_load' || authContext === 'session_restore') {
      const shouldShow = isInitializing || (!isInitialized && !inOnboardingFlow);
      console.log('[AppNavigation] Initial load/session restore - showing splash:', shouldShow);
      return shouldShow;
    }
    
    // Default case - show if initializing or not initialized
    const shouldShow = isInitializing || (!isInitialized && !inOnboardingFlow);
    console.log('[AppNavigation] Default case - showing splash:', shouldShow);
    return shouldShow;
  };

  // Add debug logging for splash screen decision
  useEffect(() => {
    console.log('[AppNavigation] Splash screen decision:', {
      authContext,
      state,
      shouldShow: shouldShowBrandedSplash(),
      isInitializing,
      isInitialized,
      inOnboardingFlow: segments[0] === 'onboarding'
    });
  }, [authContext, state, isInitializing, isInitialized, segments]);

  useEffect(() => {
    if (loading) {
      console.log('[AppNavigation] Auth still loading, waiting...');
      return;
    }

    // Debug segments
    console.log('[AppNavigation] Segment analysis:', {
      segments,
      firstSegment: segments[0],
      inAuthGroup,
      inWelcomeGroup,
      inOnboardingFlow,
      inMainApp
    });

    // Debug public route detection
    console.log('[AppNavigation] Public route detection:', {
      segments,
      isOnPublicRoute,
      hasSession: !!session,
      willRedirect: !session && !isOnPublicRoute
    });

    // Debug navigation attempts
    console.log('[AppNavigation] Navigation attempt detected:', {
      segments,
      isOnPublicRoute,
      hasSession: !!session,
      currentRoute: segments.join('/'),
      timestamp: new Date().toISOString()
    });

    console.log('[AppNavigation] Navigation decision:', {
      session: !!session,
      state,
      authContext,
      isInitialized,
      segments: segments,
      inWelcomeGroup,
      inMainApp,
      inOnboardingFlow,
      sessionId: session?.user?.id,
    });

    if (!session) {
      // If not authenticated, redirect to welcome page
      if (!isOnPublicRoute) {
        console.log('[AppNavigation] No session, redirecting to welcome');
        console.log('[AppNavigation] Redirecting from:', segments.join('/'), 'to /welcome');
        router.replace('/welcome');
        console.log('[AppNavigation] Redirect completed');
      } else if (isOnPublicRoute) {
        console.log('[AppNavigation] User in auth group, allowing access to auth screens');
        console.log('[AppNavigation] Allowing access to:', segments.join('/'));
      } else if (inWelcomeGroup) {
        console.log('[AppNavigation] User on welcome screen');
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
      if (inOnboardingFlow) {
        console.log('[AppNavigation] User in onboarding flow, skipping navigation', {
          isInOnboarding,
          inOnboardingFlow,
          isRecentSignup,
          segments: segments
        });
        return;
      }
      
      // For authenticated users who completed onboarding but isInOnboarding is still true,
      // allow navigation to main app if they're not on an onboarding route
      if (isInOnboarding && !inOnboardingFlow && isInitialized) {
        console.log('[AppNavigation] User completed onboarding but flag still true, allowing navigation to main app');
      }
      
      // For authenticated users, prioritize navigation to main app
      if (isInitialized && !inOnboardingFlow && !inMainApp) {
        console.log('[AppNavigation] Navigating authenticated user to main app', {
          session: !!session,
          state,
          authContext,
          inMainApp,
          segments: segments,
          sessionId: session?.user?.id,
        });
        router.replace('/(tabs)');
      } else if (session && !isInitialized && !inOnboardingFlow) {
        // If authenticated but not initialized, wait for initialization
        console.log('[AppNavigation] Authenticated user waiting for initialization', {
          session: !!session,
          state,
          authContext,
          inMainApp,
          segments: segments,
          sessionId: session?.user?.id,
        });
        // Don't navigate yet, let initialization complete
      } else if (session && isInitialized && inWelcomeGroup) {
        // If authenticated, initialized user is on welcome screen, redirect immediately
        console.log('[AppNavigation] Redirecting authenticated user from welcome to main app', {
          session: !!session,
          state,
          authContext,
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

  // Listen for signup events to track timing
  useEffect(() => {
    if (isInOnboarding && session) {
      setLastSignupTime(Date.now());
    }
  }, [isInOnboarding, session]);

  // Debug logging
  console.log('[AppNavigation] Navigation state:', {
    isInitializing,
    isInitialized,
    session: !!session,
    inMainApp,
    inOnboardingFlow,
    segments: segments,
  });
  
  // Add debug logging for isInOnboarding
  console.log('[AppNavigation] Onboarding state:', {
    isInOnboarding,
    inOnboardingFlow,
    segments: segments,
    session: !!session,
    state,
    authContext
  });
  
  // Update splash screen logic
  if (shouldShowBrandedSplash()) {
    return <BrandedSplashScreen onInitialized={() => {}} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
} 