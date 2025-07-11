import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import Animated, { 
  FadeIn,
  FadeOut,
  Layout,
  Easing,
  useAnimatedStyle
} from 'react-native-reanimated';
import { OnboardingScreen, validateOnboardingScreen } from '@/lib/api/onboarding';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSentry } from '@/contexts/SentryContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { logDebug, logWarning } from '@/lib/sentry/utils';
import DateInput from './DateInput';
import HeightWeightInput from './HeightWeightInput';
import IncrementInput from './IncrementInput';
import ResultsView from './ResultsView';
import ReinforcementView from './ReinforcementView';
import MultipleChoiceInput from './MultipleChoiceInput';
import AccountInput from './AccountInput';
import LoadingScreen from './LoadingScreen';
import PaywallScreen from './PaywallScreen';
import BackupOfferScreen from './BackupOfferScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReviewPromptView from './ReviewPromptView';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface Props {
  screen: OnboardingScreen;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const SUPPORTED_SCREEN_TYPES = [
  'reinforcement', 'disclaimer', 'date', 'slider',
  'multipleChoice', 'account', 'loading', 'results',
  'heightWeight', 'increment', 'paywall', 'reviewPrompt',
  'backupOffer'
];

export default function DynamicOnboardingScreen({ screen }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const { getIconComponent, screens } = useOnboardingScreens();
  const colors = Colors[theme];
  const { track } = useAnalytics();
  const { captureError } = useSentry();
  
  // Calculate screen number (1-based index) with defensive programming
  const screenIndex = screens.findIndex(s => s.id === screen.id);
  const screenNumber = screenIndex >= 0 ? screenIndex + 1 : 0;
  
  // Add debug logging for screen number calculation
  React.useEffect(() => {
    logDebug('DynamicOnboardingScreen: Screen number calculation', {
      screen_id: screen.id,
      total_screens: screens.length,
      screen_index: screenIndex,
      calculated_screen_number: screenNumber,
      available_screen_ids: screens.map(s => s.id),
    });
  }, [screen.id, screens, screenIndex, screenNumber]);
  
  // Track screen view when component mounts
  React.useEffect(() => {
    track(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, {
      screen_id: screen.id,
      screen_title: screen.title,
      screen_type: screen.type,
      screen_number: screenNumber,
      variant: screen.variant || 'default',
    });
    
  }, [screen.id, screen.title, screen.type, screen.variant, screenNumber, track]);
  
  // Handle both string (API) and component (fallback) icons
  const Icon = typeof screen.icon === 'string' 
    ? getIconComponent(screen.icon)
    : screen.icon;

  const contentStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.onboardingBackground,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 40 : 40,
  }));

  // Only for backupOffer: check if seen, and set as seen
  React.useEffect(() => {
    const checkAndSetSeen = async () => {
      if (screen.type === 'backupOffer') {
        const seen = await AsyncStorage.getItem('seenBackupOffer');
        if (seen === 'true') {
          // TODO: Implement this at the paywall cancelled step
          await AsyncStorage.setItem('seenBackupOffer', 'true');
        } else {
          await AsyncStorage.setItem('seenBackupOffer', 'true');
        }
      }
    };
    checkAndSetSeen();
  }, [screen.type]);

  const handleContinue = () => {
    if (screen.nextScreen) {
      router.push(`/onboarding/${screen.nextScreen}`);
    }
  };

  // Ensure screenNumber is always a valid number
  const safeScreenNumber = typeof screenNumber === 'number' && screenNumber > 0 ? screenNumber : 0;

  const renderFallbackScreen = (message: string) => (
    <View style={styles.fallbackContainer}>
      <Text style={[styles.fallbackText, { color: colors.text }]}>
        {message}
      </Text>
      <TouchableOpacity 
        style={[styles.continueButton, { backgroundColor: colors.primary }]} 
        onPress={handleContinue}
      >
        <Text style={[styles.continueButtonText, { color: colors.onboardingBackground }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    // Check if screen type is supported
    if (!SUPPORTED_SCREEN_TYPES.includes(screen.type)) {
      // Track unsupported screen type errors
      const error = new Error(`Unsupported screen type: ${screen.type}`);
      logDebug(error.message, {
        context: 'DynamicOnboardingScreen.renderContent',
        extra: {
          screenId: screen.id,
          screenType: screen.type,
          supportedTypes: SUPPORTED_SCREEN_TYPES,
        },
      });
      return renderFallbackScreen('Unsupported screen type');
    }

    // Validate screen data
    const validation = validateOnboardingScreen(screen);
    if (!validation.isValid) {
      // Track screen validation errors
      const error = new Error('Screen validation failed');
      logDebug(error.message, {
        context: 'DynamicOnboardingScreen.renderContent',
        extra: {
          screenId: screen.id,
          screenType: screen.type,
          validationErrors: validation.errors,
        },
      });
      return renderFallbackScreen('Screen data is incomplete');
    }

    switch (screen.type) {
      case 'reinforcement':
      case 'disclaimer':
        return <ReinforcementView onContinue={handleContinue} content={screen.reinforcementContent || {}} />;
      case 'date':
        return <DateInput onContinue={handleContinue} />;
      case 'heightWeight':
        return <HeightWeightInput onContinue={handleContinue} showMetricToggle={screen.showMetricToggle} />;
      case 'increment': {
        const incrementFieldMap: { [key: string]: 'sleep' | 'exerciseFrequency' } = { 'sleep': 'sleep', 'exercise-frequency': 'exerciseFrequency' };
        const incrementField = (incrementFieldMap[screen.id] as 'sleep' | 'exerciseFrequency') || 'sleep';
        return <IncrementInput 
          field={incrementField}
          onContinue={handleContinue} 
          config={screen.incrementConfig || { min: 0, max: 10, step: 1, unit: '', defaultValue: 5 }}
          infoCard={screen.infoCard}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      }
      case 'multipleChoice': {
        const fieldMap: { [key: string]: string } = {
          'activity': 'activity',
          'goals': 'goals',
          'exercise': 'exercise',
          'diet': 'diet',
          'sugar': 'sugar',
          'morning-wood': 'morningWood',
          'symptoms': 'symptoms',
          'ejaculation': 'ejaculation',
          'ejaculation-feeling': 'ejaculationFeeling'
        };
        const field = fieldMap[screen.id] || 'activity';
        return <MultipleChoiceInput 
          onContinue={handleContinue} 
          options={screen.options || []}
          multiSelect={screen.multiSelect || false}
          field={field}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      }
      case 'account':
        return <AccountInput 
          onContinue={handleContinue} 
          reinforcementContent={screen.reinforcementContent}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      case 'loading':
        return <LoadingScreen 
          onComplete={handleContinue}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      case 'results':
        return <ResultsView 
          onContinue={handleContinue} 
          screen={screen}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      case 'paywall':
        if (!screen.paywallContent) {
          return renderFallbackScreen('Paywall content is missing');
        }
        return <PaywallScreen 
          paywallContent={screen.paywallContent}
          onContinue={handleContinue}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      case 'reviewPrompt':
        if (!screen.reviewPromptContent) {
          return renderFallbackScreen('Review prompt content is missing');
        }
        return <ReviewPromptView 
          onContinue={handleContinue} 
          content={screen.reviewPromptContent}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      case 'backupOffer':
        if (!screen.backupOfferContent) {
          return renderFallbackScreen('Backup offer content is missing');
        }
        return <BackupOfferScreen 
          backupOfferContent={screen.backupOfferContent}
          onContinue={() => router.push('/(tabs)')}
          screenId={screen.id}
          screenTitle={screen.title}
          variant={screen.variant}
          screenNumber={safeScreenNumber}
        />;
      default:
        return renderFallbackScreen('Unsupported screen type');
    }
  };

  if (screen.type === 'results' && screen.results) {
    const { ctaText, ctaSubtext } = screen.results;
    return (
      <SafeAreaView style={[styles.container, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}>
        <View style={[{ flex: 1 }, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}>
          <AnimatedScrollView
            style={[{ flex: 1 }, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}
            contentContainerStyle={[styles.scrollContent, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}
          >
            <Animated.View
              style={[styles.content, contentStyle]}
              layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
            >
              <View style={styles.headingRow}>
                {Icon && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
                  >
                    <Icon size={32} color={colors.primary} style={styles.iconInline} />
                  </Animated.View>
                )}
                <Animated.Text
                  style={[styles.heading, { color: colors.text }]}
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(200)}
                  layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
                >
                  {screen.title}
                </Animated.Text>
              </View>
              {screen.description && (
                <Animated.Text
                  style={[styles.description, { color: colors.muted }]}
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(200)}
                  layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
                >
                  {screen.description}
                </Animated.Text>
              )}
              <Animated.View
                entering={FadeIn.duration(300).delay(150)}
                exiting={FadeOut.duration(200)}
                layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
                style={styles.contentWrapper}
              >
                <ResultsView 
                  onContinue={handleContinue} 
                  screen={screen}
                  screenId={screen.id}
                  screenTitle={screen.title}
                  variant={screen.variant}
                  screenNumber={safeScreenNumber}
                />
              </Animated.View>
            </Animated.View>
          </AnimatedScrollView>
          {/* CTA Section pinned to bottom */}
          <View style={[styles.ctaSectionPinned, { borderTopColor: colors.border }, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}>
            <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.ctaBg }]} onPress={handleContinue}>
              <Text style={[styles.ctaButtonText, { color: colors.ctaText }]}>{ctaText}</Text>
            </TouchableOpacity>
            <Text style={[styles.ctaSubtextStyle, { color: colors.muted }]}>{ctaSubtext}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}>
      <AnimatedScrollView 
        style={[styles.scrollView, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]} 
        contentContainerStyle={[styles.scrollContent, styles.onboardingBg, { backgroundColor: colors.onboardingBackground }]}
      >
        <Animated.View 
          style={[styles.content, contentStyle]}
          layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
        >
          <View style={styles.headingRow}>
            {Icon && (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(200)}
                layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
              >
                <Icon size={32} color={colors.primary} style={styles.iconInline} />
              </Animated.View>
            )}
            {screen.type !== 'loading' && (
              <Animated.Text
                style={[styles.heading, { color: colors.text }]}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(200)}
                layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
              >
                {screen.title}
              </Animated.Text>
            )}
          </View>
          {screen.type !== 'loading' && screen.description && (
            <Animated.Text 
              style={[styles.description, { color: colors.muted }]}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
            >
              {screen.description}
            </Animated.Text>
          )}

          <Animated.View
            entering={FadeIn.duration(300).delay(150)}
            exiting={FadeOut.duration(200)}
            layout={Layout.easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
            style={styles.contentWrapper}
          >
            {renderContent()}
          </Animated.View>
        </Animated.View>
      </AnimatedScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    flex: 1,
    maxWidth: 640,
    marginHorizontal: 'auto',
    width: '100%',
  },
  contentWrapper: {
    // flex: 1,
  },
  icon: {
    marginBottom: 24,
  },
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    marginBottom: 12,
    flex: 1,
    flexShrink: 1,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  defaultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  ctaSectionPinned: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  ctaButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  ctaSubtextStyle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconInline: {
    marginRight: 14,
    marginBottom: 0,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  onboardingBg: {},
});