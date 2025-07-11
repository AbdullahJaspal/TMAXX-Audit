import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ArrowRight, Dumbbell, Sun, Brain, Activity, Zap, Lock } from 'lucide-react-native';
import { OnboardingScreen } from '@/lib/api/onboarding';
import ProjectionChart from '../ProjectionChart';
import { useTheme } from '@/contexts/ThemeContext';
import { useResults } from '@/contexts/ResultsContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import Colors from '@/constants/Colors';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

interface Props {
  onContinue: () => void;
  screen: OnboardingScreen;
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

const ICON_MAP: Record<string, any> = {
  Dumbbell,
  Sun,
  Brain,
  Activity,
  Zap,
};

export default function ResultsView({ onContinue, screen, screenId, screenTitle, variant, screenNumber }: Props) {
  const { theme } = useTheme();
  const { results, error } = useResults();
  const { track } = useAnalytics();
  const colors = Colors[theme];

  // Show loading or error state if results are not available - do this before any other logic
  if (!results) {
    return (
      <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {error ? 'Error Loading Results' : 'Loading Results...'}
          </Text>
          <Text style={[styles.planDescription, { color: colors.muted }]}>
            {error || 'Please wait while we process your responses.'}
          </Text>
        </View>
      </View>
    );
  }

  // Track results screen view
  useEffect(() => {
    // Ensure screenNumber is valid
    const validScreenNumber = typeof screenNumber === 'number' && screenNumber > 0 ? screenNumber : undefined;
    
    console.log('🔍 [ResultsView] Tracking results screen view:', {
      screen_id: screenId,
      screen_title: screenTitle,
      screen_number: validScreenNumber,
      variant: variant || 'default',
      alreadyProcessed: results?.alreadyProcessed,
      lastProcessedDate: results?.lastProcessedDate,
    });
    
    track(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, {
      screen_id: screenId || 'results',
      screen_title: screenTitle || 'Your Testosterone Profile',
      screen_type: 'results',
      screen_number: validScreenNumber,
      variant: variant || 'default',
      alreadyProcessed: results?.alreadyProcessed,
    });
    
    console.log('✅ [ResultsView] Results screen view tracked successfully');
  }, [screenId, screenTitle, screenNumber, variant, track, results?.alreadyProcessed, results?.lastProcessedDate]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error Loading Results',
        'We encountered an issue while loading your results. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              // You could implement a retry mechanism here
              console.log('User wants to retry loading results');
            },
          },
        ]
      );
    }
  }, [error]);

  const requestNotificationPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }
      
      // Track notification permission request result
      const permissionGranted = finalStatus === 'granted';
      track(ANALYTICS_EVENTS.ONBOARDING_NOTIFICATION_PERMISSION_REQUESTED, {
        permission_granted: permissionGranted,
        screen_id: screenId || 'results',
        screen_title: screenTitle || 'Your Testosterone Profile',
        variant: variant || 'default',
        screen_number: typeof screenNumber === 'number' && screenNumber > 0 ? screenNumber : undefined,
        previous_permission_status: existingStatus,
      });
      
      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Only try to get push token if we have a projectId
      if (process.env.EXPO_PROJECT_ID) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        });
        console.log('Push token:', token);
      } else {
        console.log('Push notifications not configured: Missing projectId');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      
      // Track error case
      track(ANALYTICS_EVENTS.ONBOARDING_NOTIFICATION_PERMISSION_REQUESTED, {
        permission_granted: false,
        screen_id: screenId || 'results',
        screen_title: screenTitle || 'Your Testosterone Profile',
        variant: variant || 'default',
        screen_number: typeof screenNumber === 'number' && screenNumber > 0 ? screenNumber : undefined,
        previous_permission_status: 'unknown',
      });
    }
  };

  const {
    testosteroneValue,
    testosteroneUnit,
    testosteroneLabel,
    optimalLabel,
    optimalValue,
    optimalRangeNote,
    findingsTitle,
    findings,
    planTitle,
    planDescription,
    testimonial,
    protocolTitle,
    protocolNote,
    protocol,
    progressTitle,
    progressNote,
    progress,
    benefitsTitle,
    benefits,
    testimonial2,
    ctaText,
    ctaSubtext,
    paywall,
  } = results;

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${Math.min((testosteroneValue / optimalValue) * 100, 100)}%`,
    backgroundColor: colors.primary,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 0, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Testosterone Level Section */}
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.estLabel, { color: colors.muted }]}>Est T Level</Text>
          <View style={styles.valueRow}>
            {paywall ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Lock size={28} color={colors.muted} />
                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 18, color: colors.muted }}>Subscribe to unlock</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.valueLarge, { color: colors.primary }]}>{testosteroneValue}</Text>
                <Text style={[styles.valueUnit, { color: colors.primary }]}>{testosteroneUnit}</Text>
              </>
            )}
          </View>
          {/* You Bar */}
          <View style={styles.barRow}>
            <Text style={[styles.barLabel, { color: colors.text }]}>You</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                <Animated.View style={[styles.barFill, barFillStyle]} />
              </View>
            </View>
            <Text style={[styles.barValue, { color: colors.text }]}>
              {paywall ? <Lock size={16} color={colors.muted} /> : `${testosteroneValue} ${testosteroneUnit}`}
            </Text>
          </View>
          {/* Optimal Bar */}
          <View style={styles.barRow}>
            <Text style={[styles.barLabel, { color: colors.text }]}>{optimalLabel}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barBg, { backgroundColor: colors.success }]}>
                <View style={[styles.barFillOptimal, { width: '100%', backgroundColor: colors.success }]} />
              </View>
            </View>
            <Text style={[styles.barValue, { color: colors.text }]}>{optimalValue} {testosteroneUnit}</Text>
          </View>
        </View>

        {/* What's Holding You Back */}
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{findingsTitle}</Text>
          {findings.map((finding, idx) => (
            <View key={idx} style={styles.holdingBackRow}>
              <Text style={styles.holdingBackEmoji}>{finding.emoji}</Text>
              <Text style={[styles.holdingBackText, { color: colors.text }]}>{finding.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan Section */}
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{planTitle}</Text>
          <Text style={[styles.planDescription, { color: colors.muted }]}>{planDescription}</Text>
          <View style={[styles.testimonialBoxOutlined, { backgroundColor: colors.onboardingBackground, borderColor: colors.border }]}>
            <View style={styles.testimonialQuoteRow}>
              <Text style={[styles.testimonialQuoteMark, { color: colors.primary }]}>"</Text>
              <Text style={[styles.testimonialText, { color: colors.text }]}>{testimonial.text}</Text>
            </View>
            <View style={styles.testimonialMetaRow}>
              <View style={[styles.testimonialProfileCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.testimonialProfileInitial, { color: colors.background }]}>
                  {testimonial.name?.trim()?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.testimonialMetaTextCol}>
                <Text style={[styles.testimonialName, { color: colors.text }]}>{testimonial.name}</Text>
                {testimonial.tLevel && (
                  <Text style={[styles.testimonialTLevel, { color: colors.muted }]}>{testimonial.tLevel}</Text>
                )}
                <View style={styles.testimonialStarsRow}>
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Text key={i} style={[styles.testimonialStar, { color: colors.warning }]}>★</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Protocol Section */}
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{protocolTitle}</Text>
          <Text style={[styles.protocolNote, { color: colors.muted }]}>{protocolNote}</Text>
          {paywall ? (
            <>
              {/* Show only the first protocol item */}
              {protocol.slice(0, 1).map((item, idx) => {
                const Icon = ICON_MAP[item.icon] || Activity;
                return (
                  <View key={idx} style={[styles.protocolRowCard, { backgroundColor: colors.cardBackground }]}>
                    <Icon size={20} color={colors.primary} />
                    <Text style={[styles.protocolText, { color: colors.text }]}>{item.text}</Text>
                  </View>
                );
              })}
              {/* Locked items */}
              {protocol.slice(1).map((item, idx) => (
                <View key={idx} style={[styles.protocolRowCard, { backgroundColor: colors.cardBackground }]}>
                  <Lock size={20} color={colors.muted} />
                  <Text style={[styles.protocolText, { color: colors.muted }]}>Subscribe to unlock</Text>
                </View>
              ))}
            </>
          ) : (
            protocol.map((item, idx) => {
              const Icon = ICON_MAP[item.icon] || Activity;
              return (
                <View key={idx} style={[styles.protocolRowCard, { backgroundColor: colors.cardBackground }]}>
                  <Icon size={20} color={colors.primary} />
                  <Text style={[styles.protocolText, { color: colors.text }]}>{item.text}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Projection section Section */}
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{progressTitle}</Text>
          <Text style={[styles.progressNote, { color: colors.muted }]}>{progressNote}</Text>
          <View style={{ position: 'relative', minHeight: 120, justifyContent: 'center', alignItems: 'center' }}>
            <ProjectionChart
              points={progress}
              height={120}
              lockStartValue={paywall}
              lockEndValue={paywall}
            />
          </View>
        </View>

        {/* Benefits Section */}
        <View style={[styles.topCard, { backgroundColor: colors.onboardingCardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{benefitsTitle}</Text>
          <View style={styles.benefitsPillRow}>
            {benefits.map((b, idx) => (
              <View key={idx} style={[styles.benefitPill, { backgroundColor: colors.onboardingCardBackground, borderColor: colors.border }]}>
                <Text style={styles.benefitPillEmoji}>{b.emoji}</Text>
                <Text style={[styles.benefitPillText, { color: colors.text }]}>{b.text}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.testimonialBoxOutlined, { backgroundColor: colors.onboardingBackground, borderColor: colors.border }]}>
            <View style={styles.testimonialQuoteRow}>
              <Text style={[styles.testimonialQuoteMark, { color: colors.primary }]}>"</Text>
              <Text style={[styles.testimonialText, { color: colors.text }]}>{testimonial2.text}</Text>
            </View>
            <View style={styles.testimonialMetaRow}>
              <View style={[styles.testimonialProfileCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.testimonialProfileInitial, { color: colors.background }]}>
                  {testimonial2.name?.trim()?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.testimonialMetaTextCol}>
                <Text style={[styles.testimonialName, { color: colors.text }]}>{testimonial2.name}</Text>
                {testimonial2.tLevel && (
                  <Text style={[styles.testimonialTLevel, { color: colors.muted }]}>{testimonial2.tLevel}</Text>
                )}
                <View style={styles.testimonialStarsRow}>
                  {Array.from({ length: testimonial2.rating }).map((_, i) => (
                    <Text key={i} style={[styles.testimonialStar, { color: colors.warning }]}>★</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section
        <View style={styles.ctaContainer}>
          <Text style={[styles.ctaText, { color: colors.text }]}>{ctaText}</Text>
          <Text style={[styles.ctaSubtext, { color: colors.muted }]}>{ctaSubtext}</Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={onContinue}
          >
            <Text style={[styles.ctaButtonText, { color: colors.ctaText }]}>Continue</Text>
            <ArrowRight size={20} color={colors.ctaText} />
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  estLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  valueLarge: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
  },
  valueUnit: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginLeft: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    width: 60,
  },
  barContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barFillOptimal: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    width: 80,
    textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  holdingBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  holdingBackEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  holdingBackText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flex: 1,
  },
  planDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  testimonialBoxOutlined: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  testimonialQuoteRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  testimonialQuoteMark: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    marginRight: 8,
  },
  testimonialText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  },
  testimonialMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testimonialProfileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  testimonialProfileInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  testimonialMetaTextCol: {
    flex: 1,
  },
  testimonialName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  testimonialTLevel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  testimonialStarsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  testimonialStar: {
    fontSize: 16,
    marginRight: 2,
  },
  protocolNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  protocolRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  protocolText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flex: 1,
  },
  progressNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  benefitsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  benefitPillEmoji: {
    fontSize: 16,
  },
  benefitPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  ctaContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
});