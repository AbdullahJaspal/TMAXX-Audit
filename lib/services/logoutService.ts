import { OnboardingAPI } from '@/lib/api/onboarding';

// Global references to context setters - these will be set by the contexts themselves
let contextSetters: {
  clearUser?: () => void;
  clearResponses?: () => void;
  clearScreens?: () => void;
  setScreens?: (screens: any[]) => void;
  clearProgress?: () => void;
  clearResults?: () => void;
  clearHabits?: () => void;
  clearSquad?: () => void;
} = {};

// Function to register context setters
export const registerContextSetters = (setters: typeof contextSetters) => {
  contextSetters = { ...contextSetters, ...setters };
};

// Function to clear all contexts
export const clearAllContexts = async () => {
  try {
    console.log('🧹 [LogoutService] Clearing all contexts...', {
      timestamp: new Date().toISOString()
    });
    
    // Clear all contexts
    console.log('🗑️ [LogoutService] Clearing user context...');
    contextSetters.clearUser?.();
    
    console.log('🗑️ [LogoutService] Clearing responses context...');
    contextSetters.clearResponses?.();
    
    console.log('🗑️ [LogoutService] Clearing screens context...');
    contextSetters.clearScreens?.();
    
    console.log('🗑️ [LogoutService] Clearing progress context...');
    contextSetters.clearProgress?.();
    
    console.log('🗑️ [LogoutService] Clearing results context...');
    contextSetters.clearResults?.();
    
    console.log('🗑️ [LogoutService] Clearing habits context...');
    contextSetters.clearHabits?.();
    
    console.log('🗑️ [LogoutService] Clearing squad context...');
    contextSetters.clearSquad?.();
    
    console.log('✅ [LogoutService] All contexts cleared', {
      timestamp: new Date().toISOString()
    });
    
    // Don't refetch onboarding screens here - let the AppNavigation handle it
    // when the user navigates to the welcome screen
    
  } catch (error) {
    console.warn('[LogoutService] Error clearing contexts:', error);
  }
};

// Separate function to refetch onboarding screens (called by AppNavigation)
export const refetchOnboardingScreens = async () => {
  try {
    console.log('[LogoutService] Refetching onboarding screens for next user...');
    const onboardingAPI = new OnboardingAPI();
    const screens = await onboardingAPI.getOnboardingFlow();
    console.log('[LogoutService] Onboarding screens refetched:', screens.length);
    contextSetters.setScreens?.(screens);
  } catch (onboardingError) {
    console.warn('[LogoutService] Failed to refetch onboarding screens:', onboardingError);
  }
}; 