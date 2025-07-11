import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import Colors from '@/constants/Colors';

interface BackupOfferContent {
  headline: string;
  subheadline: string;
  price: string;
  billed: string;
  features: Array<string>;
  ctaLabel: string;
  footer: string;
  animationType?: string;
}

interface Props {
  backupOfferContent: BackupOfferContent;
  onContinue: () => void;
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

const COUNTDOWN_SECONDS = 5 * 60; // 5 minutes

const BackupOfferScreen: React.FC<Props> = ({ backupOfferContent, onContinue, screenId, screenTitle, variant, screenNumber }) => {
  const { theme } = useTheme();
  const { setInOnboarding } = useAuth();
  const { track } = useAnalytics();
  const colors = Colors[theme];
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [expired, setExpired] = useState(false);

  // Track backup offer screen view
  useEffect(() => {
    
    track(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, {
      screen_id: screenId || 'backup-offer',
      screen_title: screenTitle || 'Last Chance to Join for Just $1.67/month',
      screen_type: 'backupOffer',
      screen_number: screenNumber,
      variant: variant || 'default',
    });
    
  }, [screenId, screenTitle, screenNumber, variant, track]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setExpired(true);
      // Auto-redirect after 2 seconds
      const timeout = setTimeout(() => {
        // Reset onboarding flag before navigating to main app
        setInOnboarding(false);
        onContinue();
      }, 2000);
      return () => clearTimeout(timeout);
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onContinue, setInOnboarding]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleContinue = () => {
    // Reset onboarding flag before navigating to main app
    setInOnboarding(false);
    onContinue();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <Animated.View entering={BounceIn.duration(700)} style={[styles.card, { backgroundColor: colors.yellowCardBg }]}>
        <Text style={[styles.timer, { color: colors.warning }]}>
          {expired ? 'Offer expired' : `Offer expires in ${formatTime(secondsLeft)}`}
        </Text>
        <Text style={[styles.headline, { color: colors.text }]}>{backupOfferContent.headline}</Text>
        <Text style={[styles.subheadline, { color: colors.muted }]}>{backupOfferContent.subheadline}</Text>
        <View style={styles.featuresBox}>
          {backupOfferContent.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity 
          style={[
            styles.ctaButton, 
            { backgroundColor: colors.primary },
            expired && { backgroundColor: colors.ctaDisabled }
          ]} 
          onPress={handleContinue} 
          disabled={expired}
        >
          <Text style={[styles.ctaButtonText, { color: colors.ctaText }]}>{backupOfferContent.ctaLabel}</Text>
        </TouchableOpacity>
        <Text style={[styles.footer, { color: colors.muted }]}>{backupOfferContent.footer}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  timer: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  headline: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheadline: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresBox: {
    width: '100%',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkmark: {
    fontSize: 18,
    marginRight: 10,
  },
  featureText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  footer: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BackupOfferScreen; 