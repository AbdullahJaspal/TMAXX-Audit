import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import Colors from '@/constants/Colors';

export default function StartScreen() {
  const router = useRouter();
  const [firstScreenId, setFirstScreenId] = useState<string | null>(null);
  const { theme } = useTheme();
  const { screens } = useOnboardingScreens();
  const colors = Colors[theme];

  useEffect(() => {
    if (screens.length > 0) {
      setFirstScreenId(screens[0].id);
    }
  }, [screens]);

  const handleGetStarted = () => {
    if (firstScreenId) {
      router.push(`/onboarding/${firstScreenId}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&fit=crop' }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)' }]} />
      </View>
      
      <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Improve your Testosterone, Improve your Life
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Answer a few quick questions to get your personalized testosterone profile and plan.
          </Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.ctaBg }]}
            onPress={handleGetStarted}
          >
            <Text style={[styles.buttonText, { color: colors.ctaText }]}>Get Started</Text>
            <ArrowRight size={20} color={colors.ctaText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => {
              console.log('[Welcome] Login button clicked');
              console.log('[Welcome] Attempting to navigate to /(auth)/login');
              try {
                router.push('/(auth)/login');
                console.log('[Welcome] Navigation to login screen initiated');
              } catch (error) {
                console.error('[Welcome] Error navigating to login:', error);
              }
            }}
          >
            <Text style={[styles.signInText, { color: colors.primary }]}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: '70%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    paddingHorizontal: 24,
  },
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  signInButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});