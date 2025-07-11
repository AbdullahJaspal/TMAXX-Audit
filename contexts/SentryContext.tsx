import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sentry } from '@/lib/sentry';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';

interface SentryContextType {
  isReady: boolean;
  captureError: (error: Error, context?: Record<string, any>) => void;
  captureMessage: (message: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug', context?: Record<string, any>) => void;
  setUser: (user: { id?: string; email?: string; username?: string; [key: string]: any }) => void;
  clearUser: () => void;
  addBreadcrumb: (breadcrumb: { message: string; category?: string; level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'; data?: Record<string, any> }) => void;
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: any) => void;
  setContext: (name: string, context: Record<string, any>) => void;
  nativeCrash: () => void;
}

const SentryContext = createContext<SentryContextType | undefined>(undefined);

interface SentryProviderProps {
  children: ReactNode;
}

export function SentryProvider({ children }: SentryProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const { session } = useAuth();
  const { user: userData } = useUser();

  // Initialize Sentry
  useEffect(() => {
    const initializeSentry = async () => {
      try {
        const success = await sentry.initialize();
        setIsReady(success);
      } catch (error) {
        console.error('Failed to initialize Sentry:', error);
        setIsReady(false);
      }
    };

    initializeSentry();
  }, []);

  // Set user context when auth user changes
  useEffect(() => {
    if (isReady && session?.user) {
      const userContext = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.email?.split('@')[0], // Use email prefix as username
        ...userData && {
          name: userData.name,
          tLevel: userData.tLevel,
          streakDays: userData.streakDays,
          squad_id: userData.squad_id,
        },
      };
      
      sentry.setUser(userContext);
      
      // Set additional user context
      if (userData) {
        sentry.setUserContext({
          profile: {
            name: userData.name,
            tLevel: userData.tLevel,
            streakDays: userData.streakDays,
            squad_id: userData.squad_id,
            notifications: userData.notifications,
            hasNotificationPermission: userData.hasNotificationPermission,
          },
        });
      }
    } else if (isReady && !session?.user) {
      sentry.clearUser();
    }
  }, [isReady, session, userData]);

  const captureError = (error: Error, context?: Record<string, any>) => {
    sentry.captureError(error, context);
  };

  const captureMessage = (message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info', context?: Record<string, any>) => {
    sentry.captureMessage(message, level, context);
  };

  const setUser = (user: { id?: string; email?: string; username?: string; [key: string]: any }) => {
    sentry.setUser(user);
  };

  const clearUser = () => {
    sentry.clearUser();
  };

  const addBreadcrumb = (breadcrumb: { message: string; category?: string; level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'; data?: Record<string, any> }) => {
    sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'manual',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
    });
  };

  const setTag = (key: string, value: string) => {
    sentry.setTag(key, value);
  };

  const setExtra = (key: string, value: any) => {
    sentry.setExtra(key, value);
  };

  const setContext = (name: string, context: Record<string, any>) => {
    sentry.setContext(name, context);
  };

  const nativeCrash = () => {
    sentry.nativeCrash();
  };

  const value: SentryContextType = {
    isReady,
    captureError,
    captureMessage,
    setUser,
    clearUser,
    addBreadcrumb,
    setTag,
    setExtra,
    setContext,
    nativeCrash,
  };

  return (
    <SentryContext.Provider value={value}>
      {children}
    </SentryContext.Provider>
  );
}

export function useSentry(): SentryContextType {
  const context = useContext(SentryContext);
  if (context === undefined) {
    throw new Error('useSentry must be used within a SentryProvider');
  }
  return context;
} 