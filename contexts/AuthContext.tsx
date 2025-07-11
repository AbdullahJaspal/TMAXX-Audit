import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { useSegments } from 'expo-router';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { clearAllContexts } from '@/lib/services/logoutService';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  isInOnboarding: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  setInOnboarding: (inOnboarding: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInOnboarding, setIsInOnboarding] = useState(false);
  const segments = useSegments();

  // Helper function to safely track analytics
  const trackAnalytics = (eventName: string, properties?: Record<string, any>) => {
    try {
      // Try to import and use analytics dynamically
      const { analytics } = require('@/lib/analytics/service');
      analytics.track(eventName, properties);
    } catch (error) {
      // Analytics not available, silently continue
      console.log('[AuthContext] Analytics not available for tracking:', eventName);
    }
  };

  // Helper function to safely set user ID in analytics
  const setAnalyticsUserId = (userId: string | null) => {
    try {
      const { analytics } = require('@/lib/analytics/service');
      if (userId) {
        analytics.setUserId(userId);
        console.log('[AuthContext] User ID set in analytics:', userId);
      } else {
        // Clear user ID by setting it to null/undefined
        analytics.setUserId('');
        console.log('[AuthContext] User ID cleared from analytics');
      }
    } catch (error) {
      // Analytics not available, silently continue
      console.log('[AuthContext] Analytics not available for setting user ID');
    }
  };

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', !!session);
      setSession(session);
      
      // Set user ID in analytics if session exists
      if (session?.user?.id) {
        setAnalyticsUserId(session.user.id);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 [AuthContext] Auth state changed:', {
        event: _event,
        hasSession: !!session,
        sessionId: session?.user?.id,
        hasAccessToken: !!session?.access_token,
        isNewUser: session?.user?.created_at === session?.user?.last_sign_in_at,
        userCreatedAt: session?.user?.created_at,
        lastSignInAt: session?.user?.last_sign_in_at,
        timestamp: new Date().toISOString()
      });
      
      // Set or clear user ID in analytics based on session
      if (session?.user?.id) {
        setAnalyticsUserId(session.user.id);
      } else {
        setAnalyticsUserId(null);
      }
      
      // If a session was created and we're in the onboarding flow, set the flag
      if (session && segments[0] === 'onboarding') {
        console.log('[AuthContext] Session created during onboarding, setting isInOnboarding to true');
        setIsInOnboarding(true);
      }
      
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  const signUp = async (email: string, password: string) => {
    try {
      // Track signup attempt at context level
      trackAnalytics(ANALYTICS_EVENTS.SIGNUP_ATTEMPTED, {
        signup_method: 'email',
        context: 'auth_context',
      });
      
      // Set onboarding flag to true before signup
      console.log('[AuthContext] Setting isInOnboarding to true for signup');
      setIsInOnboarding(true);
      
      // Enable debug mode for this request
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email // Include email in metadata for debugging
          }
        }
      });
      
      if (error) {
        // Reset onboarding flag on error
        console.log('[AuthContext] Signup error, resetting isInOnboarding to false');
        setIsInOnboarding(false);
        
        // Enhanced error logging
        console.error('Signup Error Details:', {
          status: error.status,
          name: error.name,
          message: error.message,
          response: (error as any).response, // May contain additional error details
          stack: error.stack
        });

        if (error.status === 500) {
          // Check Supabase logs and return more specific error
          const errorMessage = error.message?.toLowerCase() || '';
          if (errorMessage.includes('database error')) {
            throw new Error(
              'Database error during signup. This may be due to:\n' +
              '- A conflict with an existing user profile\n' +
              '- Database connection issues\n' +
              '- Missing required fields\n\n' +
              'Please try again in a few minutes. If the problem persists, ' +
              'check the following:\n' +
              '1. Is your email address already registered?\n' +
              '2. Are all required profile fields filled out?\n\n' +
              'Technical details: ' + error.message
            );
          }
          throw new Error(
            'Server error during signup. Please try again in a few minutes.\n\n' +
            'Technical details: ' + error.message
          );
        }

        // Handle other specific error cases
        const errorMessage = error.message?.toLowerCase() || '';
        console.log('Checking error message:', errorMessage);
        console.log('Error name:', error.name);
        
        // Specific check for the AuthApiError with "User already registered"
        if (error.name === 'AuthApiError' && error.message === 'User already registered') {
          console.log('Caught AuthApiError with "User already registered", throwing user-friendly message');
          throw new Error('This email is already registered. Please try signing in instead.');
        }
        
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already exists') ||
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('unique constraint') ||
            errorMessage.includes('user already registered') ||
            errorMessage.includes('email already registered') ||
            errorMessage.includes('already been registered') ||
            error.status === 422) {
          console.log('Caught duplicate email error, throwing user-friendly message');
          throw new Error('This email is already registered. Please try signing in instead.');
        }

        // Handle invalid email format
        if (errorMessage.includes('invalid email') || 
            errorMessage.includes('email format')) {
          throw new Error('Please enter a valid email address.');
        }

        // Handle weak password
        if (errorMessage.includes('password') && 
            (errorMessage.includes('weak') || errorMessage.includes('short') || errorMessage.includes('minimum'))) {
          throw new Error('Password must be at least 8 characters long.');
        }

        throw error;
      }

      if (!data?.user?.id) {
        console.log('[AuthContext] No user ID returned, resetting isInOnboarding to false');
        setIsInOnboarding(false);
        throw new Error('User account created but no user ID returned. Please contact support.');
      }

      // Set user ID in analytics after successful signup
      setAnalyticsUserId(data.user.id);

      // Track successful signup at context level
      trackAnalytics(ANALYTICS_EVENTS.SIGNUP_SUCCESSFUL, {
        signup_method: 'email',
        context: 'auth_context',
        user_id: data.user.id,
      });

      console.log('[AuthContext] Signup successful, keeping isInOnboarding as true');
      // Note: We don't reset isInOnboarding here because the user should continue to the loading screen
      // The flag will be reset when they complete the onboarding flow

    } catch (error: any) {
      // Reset onboarding flag on error
      console.log('[AuthContext] Signup exception, resetting isInOnboarding to false');
      setIsInOnboarding(false);
      
      // Enhanced error logging for unexpected errors
      console.error('Detailed signup error:', {
        name: error.name,
        message: error.message,
        status: error?.status,
        stack: error.stack,
        raw: error // Log the complete error object
      });

      // If this is our custom error message, preserve it
      if (error.message?.includes('already registered') || 
          error.message?.includes('valid email address') ||
          error.message?.includes('at least 8 characters') ||
          error.message?.includes('Database error') ||
          error.message?.includes('Server error')) {
        throw error; // Preserve our custom error messages
      }

      // Check if this is a network error
      if (!error.status && !error.message?.includes('Database error')) {
        throw new Error(
          'Network error during signup. Please check your internet connection and try again.'
        );
      }

      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Set user ID in analytics after successful signin
    if (data.session?.user?.id) {
      setAnalyticsUserId(data.session.user.id);
    }
    
    // Wait for session to be set
    setSession(data.session);
    return data.session;
  };

  const signOut = async () => {
    try {
      console.log('🚪 [AuthContext] Starting signOut process...', {
        sessionId: session?.user?.id,
        hasAccessToken: !!session?.access_token,
        timestamp: new Date().toISOString()
      });
      
      // Clear all contexts first
      console.log('🧹 [AuthContext] Clearing all contexts...');
      await clearAllContexts();
      console.log('✅ [AuthContext] All contexts cleared');
      
      // Then sign out from Supabase
      console.log('🔐 [AuthContext] Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [AuthContext] Supabase signOut error:', error);
        throw error;
      }
      console.log('✅ [AuthContext] Supabase signOut successful');
      
      // Clear user ID from analytics on signout
      setAnalyticsUserId(null);
      
      // Reset onboarding flag on signout
      console.log('[AuthContext] Signout, resetting isInOnboarding to false');
      setIsInOnboarding(false);
      
      console.log('✅ [AuthContext] SignOut completed successfully', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error);
      throw error;
    }
  };

  const setInOnboarding = (inOnboarding: boolean) => {
    console.log('[AuthContext] setInOnboarding called with:', inOnboarding);
    setIsInOnboarding(inOnboarding);
  };

  return (
    <AuthContext.Provider value={{ session, loading, isInOnboarding, signUp, signIn, signOut, setInOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 