import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HabitProvider } from '@/contexts/HabitContext';
import { UserProvider } from '@/contexts/UserContext';
import { ProgressProvider } from '@/contexts/ProgressContext';
import { SquadProvider } from '@/contexts/SquadContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { OnboardingScreensProvider } from '@/contexts/OnboardingScreensContext';
import { ResultsProvider } from '@/contexts/ResultsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { SentryProvider } from '@/contexts/SentryContext';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../contexts/AuthContext';
import { InitializationProvider } from '../contexts/InitializationContext';
import { Slot } from 'expo-router';
import BrandedSplashScreen from '@/components/BrandedSplashScreen';
import InitialSplashScreen from '@/components/InitialSplashScreen';
import { AppNavigation } from './AppNavigation';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!isReady) {
    return <InitialSplashScreen onInitialized={() => setIsReady(true)} />;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ToastProvider>
            <SentryProvider>
              <AnalyticsProvider>
                <UserProvider>
                  <ProgressProvider>
                    <HabitProvider>
                      <SquadProvider>
                        <OnboardingProvider>
                          <OnboardingScreensProvider>
                            <InitializationProvider>
                              <ResultsProvider>
                                <AppNavigation />
                                <StatusBar style="auto" />
                              </ResultsProvider>
                            </InitializationProvider>
                          </OnboardingScreensProvider>
                        </OnboardingProvider>
                      </SquadProvider>
                    </HabitProvider>
                  </ProgressProvider>
                </UserProvider>
              </AnalyticsProvider>
            </SentryProvider>
          </ToastProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}