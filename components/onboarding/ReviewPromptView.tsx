import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Zap, ArrowRight } from 'lucide-react-native';
import * as StoreReview from 'expo-store-review';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSentry } from '@/contexts/SentryContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { logDebug, logError } from '@/lib/sentry/utils';
import Colors from '@/constants/Colors';

interface ReviewPromptContent {
  stars: number;
  highlightIcon: string;
  highlightText: string;
  reviews: Array<{
    avatar: string;
    username: string;
    boldText?: string;
    text: string;
  }>;
  ctaText: string;
}

interface Props {
  content: ReviewPromptContent;
  onContinue: () => void;
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

const ICON_MAP: Record<string, any> = {
  Zap,
};

export default function ReviewPromptView({ content, onContinue, screenId, screenTitle, variant, screenNumber }: Props) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();
  const { captureError } = useSentry();

  // Track review prompt screen view
  useEffect(() => {
    
    
    track(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, {
      screen_id: screenId || 'review-prompt',
      screen_title: screenTitle || 'Feeling fired up?',
      screen_type: 'reviewPrompt',
      screen_number: screenNumber,
      variant: variant || 'default',
    });
    
  }, [screenId, screenTitle, screenNumber, variant, track]);

  useEffect(() => {
    const requestReview = async () => {
      try {
        const isAvailable = await StoreReview.isAvailableAsync();
        
        if (isAvailable) {
          await StoreReview.requestReview();
        } else {
        }
      } catch (error) {
        // Track store review errors that cause negative user experience
        captureError(error instanceof Error ? error : new Error('Unknown store review error'), {
          context: 'ReviewPromptView.requestReview',
          extra: {
            screenId,
            screenTitle,
            variant,
            screenNumber,
          },
        });
      }
    };

    requestReview();
  }, []);

  const Icon = ICON_MAP[content.highlightIcon] || Zap;
  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <View style={styles.starsRow}>
        {Array.from({ length: content.stars }).map((_, i) => (
          <Text key={i} style={[styles.star, { color: colors.warning }]}>★</Text>
        ))}
      </View>
      <Text style={[
        styles.highlightText,
        { color: colors.text }
      ]}>{content.highlightText}</Text>
      <View style={styles.reviewsSection}>
        {content.reviews.map((review, idx) => (
          <View key={idx} style={[
            styles.reviewCard,
            { backgroundColor: colors.onboardingCardBackground }
          ]}>
            <Image source={{ uri: review.avatar }} style={styles.avatar} />
            <View style={styles.reviewTextCol}>
              <Text style={[
                styles.username,
                { color: colors.text }
              ]}>{review.username}</Text>
              <Text>
                {review.boldText ? (
                  <Text style={[
                    styles.boldText,
                    { color: colors.text }
                  ]}>{review.boldText} </Text>
                ) : null}
                <Text style={[
                  styles.reviewText,
                  { color: colors.text }
                ]}>{review.text}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[
        styles.continueButton,
        { backgroundColor: colors.primary }
      ]} onPress={onContinue}>
        <Text style={[
          styles.continueButtonText,
          { color: colors.ctaText }
        ]}>{content.ctaText}</Text>
        <ArrowRight size={20} color={colors.ctaText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 0,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 2,
  },
  star: {
    fontSize: 32,
    marginHorizontal: 2,
  },
  highlightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  reviewsSection: {
    width: '100%',
    marginBottom: 24,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  reviewTextCol: {
    flex: 1,
  },
  username: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  boldText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  reviewText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
    width: '100%',
  },
  continueButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
}); 