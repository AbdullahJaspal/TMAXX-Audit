import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { OnboardingScreen } from '@/lib/api/onboarding';
import DynamicOnboardingScreen from '@/components/onboarding/DynamicOnboardingScreen';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import Colors from '@/constants/Colors';

export default function OnboardingPage() {
  const { id } = useLocalSearchParams();
  const [screen, setScreen] = useState<OnboardingScreen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { screens } = useOnboardingScreens();
  const { addBreadcrumb } = useSentry();
  const colors = Colors[theme];

  useEffect(() => {
    if (!id) {
      setError('No screen ID provided');
      return;
    }

    if (screens.length === 0) {
      setError('No onboarding screens available');
      return;
    }

    const currentScreen = screens.find(s => s.id === id);
    if (!currentScreen) {
      const errorMessage = `Screen not found: ${id}`;
      setError(errorMessage);
      logError('Onboarding screen not found', new Error(errorMessage), {
        requested_screen_id: id,
        available_screen_ids: screens.map(s => s.id),
        context: 'onboarding_screen_loading'
      });
      addBreadcrumb({
        message: 'Onboarding screen not found',
        category: 'navigation',
        data: {
          requested_id: id,
          available_screens: screens.length
        }
      });
    } else {
      setScreen(currentScreen);
    }
  }, [id, screens]);

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.onboardingBackground }]}>
        <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  if (!screen) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.onboardingBackground }]}>
        <Text style={[styles.loading, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return <DynamicOnboardingScreen screen={screen} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  loading: {
    fontSize: 16,
  },
});