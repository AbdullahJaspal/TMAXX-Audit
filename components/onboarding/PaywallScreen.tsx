import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, SafeAreaView, Platform, StatusBar, Linking } from 'react-native';
import { Zap, Activity, Heart, Lock, FlaskConical } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import Colors from '@/constants/Colors';

const ICON_MAP: Record<string, any> = {
  Zap,
  Activity,
  FlaskConical,
  Lock,
};

interface Feature {
  icon: string;
  label: string;
}

interface PricingOption {
  label: string;
  price: string;
  value: string;
  badge?: string;
  dominant: boolean;
}

interface PaywallContent {
  features: Feature[];
  freeTrialLabel: string;
  freeTrialToggleDefault: boolean;
  trialMessaging: string;
  payNowMessaging: string;
  pricingOptions: PricingOption[];
  ctaLabel: string;
  ctaSubtext: string;
  footer: string;
  testimonial?: {
    text: string;
    name: string;
    rating: number;
  };
}

interface Props {
  paywallContent: PaywallContent;
  onContinue: () => void;
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

export default function PaywallScreen({ paywallContent, onContinue, screenId, screenTitle, variant, screenNumber }: Props) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();
  const [freeTrial, setFreeTrial] = useState(paywallContent.freeTrialToggleDefault);
  const [selectedPlan, setSelectedPlan] = useState(
    paywallContent.pricingOptions.find(opt => opt.dominant)?.value || paywallContent.pricingOptions[0].value
  );

  // Track paywall screen view
  useEffect(() => {    
    track(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, {
      screen_id: screenId || 'paywall',
      screen_title: screenTitle || 'Last step to get your T-boosting plan.',
      screen_type: 'paywall',
      screen_number: screenNumber,
      variant: variant || 'default',
    });
    
  }, [screenId, screenTitle, screenNumber, variant, track]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.onboardingBackground }]}>
      <View style={[styles.outer, { backgroundColor: colors.onboardingBackground }]}>
        <View style={styles.content}>
          {/* Feature Summary Row */}
          <View style={styles.featuresRow}>
            {paywallContent.features.map((feature, idx) => {
              const Icon = ICON_MAP[feature.icon] || Lock;
              return (
                <View key={idx} style={styles.featureItem}>
                  <Icon size={24} color={colors.primary} style={styles.featureIcon} />
                  <Text style={[styles.featureLabel, { color: colors.text }]}>{feature.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Pricing Options */}
          <View style={styles.pricingRow}>
            {paywallContent.pricingOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pricingPill,
                  { backgroundColor: colors.onboardingCardBackground },
                  selectedPlan === option.value && [
                    styles.pricingPillSelected,
                    { backgroundColor: colors.shadedPrimary, borderColor: colors.primary },
                    option.dominant && styles.pricingPillDominant
                  ],
                ]}
                onPress={() => setSelectedPlan(option.value)}
                activeOpacity={0.85}
              >
                <Text style={[
                  styles.pricingLabel,
                  { color: colors.text },
                  selectedPlan === option.value && [
                    styles.pricingLabelSelected,
                    { color: colors.primary },
                    option.dominant && styles.pricingLabelDominant
                  ],
                ]}>{option.label}</Text>
                <Text style={[
                  styles.pricingPrice,
                  { color: colors.muted },
                  selectedPlan === option.value && [
                    styles.pricingPriceSelected,
                    { color: colors.primary },
                    option.dominant && styles.pricingPriceDominant
                  ],
                ]}>{option.price}</Text>
                {option.badge && (
                  <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                    <Text style={[styles.badgeText, { color: colors.background }]}>{option.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Free Trial Toggle */}
          <View style={styles.trialRow}>
            <Text style={[styles.trialLabel, { color: colors.text }]}>{paywallContent.freeTrialLabel}</Text>
            <Switch
              value={freeTrial}
              onValueChange={setFreeTrial}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={freeTrial ? colors.background : colors.muted}
            />
          </View>
        </View>

        {/* Testimonial Section */}
        {paywallContent.testimonial && (
          <View style={[styles.testimonialBoxOutlined, { backgroundColor: colors.onboardingCardBackground, borderColor: colors.primary }]}>
            <View style={styles.testimonialQuoteRow}>
              <Text style={[styles.testimonialQuoteMark, { color: colors.primary }]}>"</Text>
              <Text style={[styles.testimonialText, { color: colors.text }]}>{paywallContent.testimonial.text}</Text>
            </View>
            <View style={styles.testimonialMetaRow}>
              <View style={[styles.testimonialProfileCircle, { backgroundColor: colors.primary }]}>
                <Text style={[styles.testimonialProfileInitial, { color: colors.onboardingBackground }]}>
                  {paywallContent.testimonial.name?.trim()?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.testimonialMetaTextCol}>
                <Text style={[styles.testimonialName, { color: colors.text }]}>{paywallContent.testimonial.name}</Text>
                <View style={styles.testimonialStarsRow}>
                  {Array.from({ length: paywallContent.testimonial.rating }).map((_, i) => (
                    <Text key={i} style={[styles.testimonialStar, { color: colors.warning }]}>★</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ paddingVertical: 0 }} />

        {/* Sticky CTA Section */}
        <View style={[styles.ctaSectionPinned, { backgroundColor: colors.onboardingBackground, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={onContinue} 
            activeOpacity={0.9}
          >
            <Text style={[styles.buttonText, { color: colors.ctaText }]}>{paywallContent.ctaLabel}</Text>
          </TouchableOpacity>
          {freeTrial && (
            <Text style={[styles.ctaSubtext, { color: colors.muted }]}>
              {paywallContent.ctaSubtext.replace('PRICE', paywallContent.pricingOptions.find(opt => opt.value === selectedPlan)?.price || '')}
            </Text>
          )}
          <Text style={[styles.footer, { color: colors.muted }]}>{paywallContent.footer}</Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity onPress={() => Linking.openURL('https://tmaxx.app/terms')}>
              <Text style={[styles.legalLink, { color: colors.muted }]}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={[styles.legalLinkSeparator, { color: colors.muted }]}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://tmaxx.app/privacy')}>
              <Text style={[styles.legalLink, { color: colors.muted }]}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  outer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 0,
    width: '100%',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 18,
    marginTop: 0,
    gap: 8,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
    maxWidth: 120,
  },
  featureIcon: {
    marginBottom: 2,
  },
  featureLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4,
    marginTop: 2,
    gap: 10,
  },
  trialLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginRight: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 18,
  },
  pricingPill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 0,
    position: 'relative',
  },
  pricingPillDominant: {
    shadowColor: '#00A3FF',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  pricingPillSelected: {
    borderColor: '#00A3FF',
  },
  pricingLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    marginBottom: 2,
  },
  pricingLabelDominant: {
    color: '#00A3FF',
  },
  pricingLabelSelected: {
    color: '#00A3FF',
  },
  pricingPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    marginBottom: 2,
  },
  pricingPriceDominant: {
    color: '#00A3FF',
  },
  pricingPriceSelected: {
    color: '#00A3FF',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  ctaSectionPinned: {
    paddingTop: 30,
    paddingBottom: 8,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    alignItems: 'center',
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
  ctaSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 2,
  },
  footer: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 0,
  },
  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    gap: 8,
  },
  legalLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  testimonialBoxOutlined: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  testimonialQuoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  testimonialQuoteMark: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
    marginTop: -4,
  },
  testimonialText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flex: 1,
    lineHeight: 24,
  },
  testimonialMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 14,
  },
  testimonialProfileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  testimonialProfileInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  testimonialMetaTextCol: {
    flex: 1,
  },
  testimonialStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  testimonialStar: {
    fontSize: 20,
    marginRight: 2,
  },
  testimonialName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
}); 