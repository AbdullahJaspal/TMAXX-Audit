import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useSquad } from '@/contexts/SquadContext';
import { useHabits } from '@/contexts/HabitContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import { OnboardingAPI } from '@/lib/api/onboarding';
import * as Localization from 'expo-localization';
import { updateTimezone, getUserProfile } from '@/lib/supabase/user';
import { getUserHabits } from '@/lib/supabase/habits';
import { getTLevelHistory } from '@/lib/supabase/progress';

// Add new types for context-aware initialization
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

const InitializationContext = createContext<InitializationContextType | undefined>(undefined);

// Global initialization lock to prevent multiple simultaneous initializations
let globalInitializationLock = false;

export function InitializationProvider({ children }: { children: ReactNode }) {
  // Replace state management with context-aware approach
  const [state, setState] = useState<InitializationState>('idle');
  const [authContext, setAuthContext] = useState<AuthContext>('initial_load');
  const [sessionStable, setSessionStable] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ step: string; completed: boolean }>({
    step: 'Starting...',
    completed: false,
  });

  const { session, loading: authLoading, isInOnboarding } = useAuth();
  const { refreshUser, user } = useUser();
  const { refreshSquad } = useSquad();
  const { setHabits } = useHabits();
  const { updateProgress: updateProgressContext } = useProgress();
  const { setScreens } = useOnboardingScreens();
  
  // Track previous session to detect changes
  const previousSessionRef = useRef(session);
  const hasHandledSessionChangeRef = useRef(false);
  const currentSessionRef = useRef(session);
  const sessionChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingSessionChangeRef = useRef(false);
  const initializationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add session stability detection
  const sessionStabilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateProgress = useCallback((step: string, completed: boolean = false) => {
    setProgress({ step, completed });
    console.log(`[Init] ${step} ${completed ? '✓' : '...'}`);
  }, []);

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

  useEffect(() => {
    // Clear existing timeout
    if (sessionStabilityTimeoutRef.current) {
      clearTimeout(sessionStabilityTimeoutRef.current);
    }
    
    // Set new timeout to mark session as stable
    sessionStabilityTimeoutRef.current = setTimeout(() => {
      console.log('[Init] Session marked as stable');
      setSessionStable(true);
    }, 1000); // Wait 1 second for session to stabilize
    
    return () => {
      if (sessionStabilityTimeoutRef.current) {
        clearTimeout(sessionStabilityTimeoutRef.current);
      }
    };
  }, [session]);

  // Reset initialization when session changes (e.g., login/logout)
  useEffect(() => {
    const previousSession = previousSessionRef.current;
    const currentSession = session;
    
    // Check if session state changed (login or logout)
    const wasAuthenticated = !!previousSession;
    const isAuthenticated = !!currentSession;
    const previousUserId = previousSession?.user?.id;
    const currentUserId = currentSession?.user?.id;
    
    // If we're already in a stable initialized state, don't process session changes
    const isStableInitialized = state === 'completed' && isAuthenticated;
    if (isStableInitialized) {
      console.log('[Init] Already in stable initialized state, ignoring session changes', {
        state,
        isAuthenticated,
        currentUserId,
      });
      return;
    }
    
    // Only reset if the authentication state actually changed AND we're not currently initializing
    // AND we haven't already handled this session change
    // AND the user ID is different (to prevent false triggers from session object changes)
    const userChanged = previousUserId !== currentUserId;
    const authStateChanged = wasAuthenticated !== isAuthenticated;
    
    // Only process if we have a meaningful change
    if (authStateChanged && (state === 'idle' || state === 'waiting_for_session' || state === 'completed' || state === 'error') && !hasHandledSessionChangeRef.current && userChanged && !isProcessingSessionChangeRef.current) {
      // Clear any existing timeout
      if (sessionChangeTimeoutRef.current) {
        clearTimeout(sessionChangeTimeoutRef.current);
      }
      
      // Debounce the session change to prevent rapid successive resets
      sessionChangeTimeoutRef.current = setTimeout(() => {
        console.log('[Init] Session state changed, resetting initialization', {
          wasAuthenticated,
          isAuthenticated,
          previousUserId,
          currentUserId,
          userChanged,
          isCurrentlyInitializing: state === 'initializing',
          hasHandledSessionChange: hasHandledSessionChangeRef.current,
        });
        isProcessingSessionChangeRef.current = true;
        hasHandledSessionChangeRef.current = true;
        resetInitialization();
        // Reset the flag after a short delay
        setTimeout(() => {
          isProcessingSessionChangeRef.current = false;
        }, 200);
      }, 100);
    }
    
    // If session became available during initialization, restart
    if (!wasAuthenticated && isAuthenticated && state === 'initializing') {
      console.log('[Init] Session became available during initialization, restarting', {
        wasAuthenticated,
        isAuthenticated,
        state,
        currentUserId,
      });
      resetInitialization();
    }
    
    // Update the ref to track the current session
    // Only update if the user actually changed to prevent false triggers
    if (userChanged) {
      previousSessionRef.current = currentSession;
    }
    
    // Always update current session ref
    currentSessionRef.current = currentSession;
  }, [session, resetInitialization, state]);

  // Add context-aware session change detection
  useEffect(() => {
    const newUserId = session?.user?.id || null;
    
    console.log('[Init] Session change detection:', {
      currentUserId,
      newUserId,
      currentContext: authContext,
      hasSession: !!session,
      sessionId: session?.user?.id,
      isInOnboarding
    });
    
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
    } else if (currentUserId === null && newUserId === null && authContext !== 'initial_load') {
      // Ensure we're in initial_load context when no user is present
      console.log('[Init] No user present, ensuring initial_load context');
      setAuthContext('initial_load');
    }
  }, [session?.user?.id, isInOnboarding, authContext, resetInitialization]);

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
    
    // Add debug logging for context-aware initialization
    console.log('[Init] Context-aware initialization:', {
      authContext,
      state,
      sessionStable,
      isInOnboarding,
      hasSession: !!session
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

  const value = {
    state,
    authContext,
    error,
    progress,
    initialize,
    resetInitialization,
  };

  return (
    <InitializationContext.Provider value={value}>
      {children}
    </InitializationContext.Provider>
  );
}

export function useInitialization() {
  const context = useContext(InitializationContext);
  if (context === undefined) {
    throw new Error('useInitialization must be used within an InitializationProvider');
  }
  return context;
} 