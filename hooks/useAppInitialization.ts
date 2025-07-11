import { useCallback, useRef } from 'react';
import * as Localization from 'expo-localization';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useSquad } from '@/contexts/SquadContext';
import { updateTimezone } from '@/lib/supabase/user';
import { OnboardingAPI } from '@/lib/api/onboarding';

interface UseAppInitializationOptions {
  onComplete?: () => void;
  onOnboardingScreensLoaded?: (screens: any[]) => void;
}

export function useAppInitialization({ onComplete, onOnboardingScreensLoaded }: UseAppInitializationOptions = {}) {
  const { session } = useAuth();
  const { refreshUser } = useUser();
  const { refreshSquad } = useSquad();
  const initializingRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initializingRef.current) {
      console.log('[Init] Initialization already in progress, skipping');
      return;
    }

    try {
      initializingRef.current = true;
      console.log('[Init] Starting initialization');
      console.log('[Init] Session state:', {
        exists: !!session,
        userId: session?.user?.id,
      });
      
      if (!session) {
        console.log('[Init] No session found, fetching onboarding screens');
        try {
          const onboardingAPI = new OnboardingAPI();
          const screens = await onboardingAPI.getOnboardingFlow();
          console.log('[Init] Onboarding screens loaded:', screens.length);
          onOnboardingScreensLoaded?.(screens);
        } catch (onboardingError) {
          console.warn('[Init] Failed to load onboarding screens:', onboardingError);
          // Don't throw onboarding errors as they're not critical for app startup
        }
        console.log('[Init] Onboarding initialization complete');
        onComplete?.();
        return;
      }

      console.log('[Init] Running initialization tasks for authenticated user');
      
      // Run tasks in sequence for better error tracking
      try {
        console.log('[Init] Starting user refresh');
        await refreshUser();
        console.log('[Init] User refresh complete');

        console.log('[Init] Starting squad refresh');
        await refreshSquad();
        console.log('[Init] Squad refresh complete');

        console.log('[Init] Starting timezone update');
        await updateTimezone(Localization.timezone).catch(e => {
          console.warn('[Init] Non-critical error updating timezone:', e);
          // Don't throw timezone errors as they're not critical
        });
        console.log('[Init] Timezone update complete');

        console.log('[Init] All initialization tasks completed successfully');
        onComplete?.();
      } catch (taskError: any) {
        console.error('[Init] Task error:', {
          message: taskError.message,
          stack: taskError.stack,
          name: taskError.name
        });
        throw taskError;
      }
    } catch (error: any) {
      console.error('[Init] Fatal error during initialization:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error; // Let the caller handle navigation on error
    } finally {
      initializingRef.current = false;
    }
  }, [session, refreshUser, refreshSquad, onComplete, onOnboardingScreensLoaded]);

  return { initialize };
} 