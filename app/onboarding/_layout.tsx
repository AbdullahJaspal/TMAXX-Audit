import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';

export default function OnboardingLayout() {
  const { screens, isLoading, error } = useOnboardingScreens();
  const { theme } = useTheme();
  const { setInOnboarding } = useAuth();
  const colors = Colors[theme];


  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.onboardingBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.onboardingBackground }]}>
        <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.onboardingBackground },
        animation: 'slide_from_right',
        animationDuration: 200,
        presentation: 'card',
        animationTypeForReplace: 'push',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
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
    padding: 20,
  },
});