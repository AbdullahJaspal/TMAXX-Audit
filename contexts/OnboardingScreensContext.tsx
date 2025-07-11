import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as LucideIcons from 'lucide-react-native';
import { OnboardingScreen } from '@/lib/api/onboarding';
import { registerContextSetters } from '@/lib/services/logoutService';

interface OnboardingScreensContextType {
  screens: OnboardingScreen[];
  setScreens: (screens: OnboardingScreen[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  getIconComponent: (iconName: string) => any;
  clearScreens: () => void;
}

const OnboardingScreensContext = createContext<OnboardingScreensContextType | undefined>(undefined);

// Icon translation function
const getIconComponent = (iconName: string) => {
  if (!iconName) return LucideIcons.CircleAlert;
  
  // Handle different naming conventions
  const normalizedName = iconName
    .replace(/[^a-zA-Z]/g, '') // Remove non-alphabetic characters
    .replace(/^[a-z]/, (match) => match.toUpperCase()); // Capitalize first letter
  
  return (LucideIcons as any)[normalizedName] || LucideIcons.CircleAlert;
};

// Usage example in components:
// const { getIconComponent } = useOnboardingScreens();
// const IconComponent = getIconComponent(screen.icon);
// <IconComponent size={32} color="black" />

export function OnboardingScreensProvider({ children }: { children: ReactNode }) {
  const [screens, setScreens] = useState<OnboardingScreen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrap setScreens to add logging
  const setScreensWithLogging = (newScreens: OnboardingScreen[]) => {
    console.log('[OnboardingScreensContext] Setting screens:', newScreens.length);
    setScreens(newScreens);
  };

  const clearScreens = () => {
    console.log('[OnboardingScreensContext] Clearing screens data');
    setScreens([]);
    setError(null);
    setIsLoading(false);
  };

  // Register the clearScreens and setScreens functions with the logout service
  React.useEffect(() => {
    registerContextSetters({ clearScreens, setScreens: setScreensWithLogging });
  }, []);

  const value = {
    screens,
    setScreens: setScreensWithLogging,
    isLoading,
    setIsLoading,
    error,
    setError,
    getIconComponent,
    clearScreens,
  };

  return (
    <OnboardingScreensContext.Provider value={value}>
      {children}
    </OnboardingScreensContext.Provider>
  );
}

export function useOnboardingScreens() {
  const context = useContext(OnboardingScreensContext);
  if (context === undefined) {
    throw new Error('useOnboardingScreens must be used within an OnboardingScreensProvider');
  }
  return context;
} 