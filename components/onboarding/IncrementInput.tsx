import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight, Minus, Plus } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import InfoCard from '@/components/onboarding/InfoCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import Colors from '@/constants/Colors';

interface Props {
  field: 'sleep' | 'exerciseFrequency';
  onContinue: () => void;
  config: {
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultValue: number;
  };
  infoCard?: {
    title: string;
    text: string;
  };
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

export default function IncrementInput({ field, onContinue, config, infoCard, screenId, screenTitle, variant, screenNumber }: Props) {
  const { sleep, exerciseFrequency, setSleep, setExerciseFrequency } = useOnboarding();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();

  const currentValue = field === 'sleep' ? sleep : exerciseFrequency;
  const setValue = field === 'sleep' ? setSleep : setExerciseFrequency;
  const unit = config.unit;
  const minValue = config.min;
  const maxValue = config.max;

  const handleIncrement = (increment: boolean) => {
    const newValue = increment ? (currentValue || minValue) + 1 : (currentValue || minValue) - 1;
    const clampedValue = Math.min(Math.max(newValue, minValue), maxValue);
    setValue(clampedValue);
    
    // Track value change
    track(ANALYTICS_EVENTS.ONBOARDING_SELECTION_MADE, {
      screen_id: screenId,
      screen_title: screenTitle,
      field: field,
      selection_value: clampedValue,
      selection_unit: unit,
      variant: variant || 'default',
      action: increment ? 'incremented' : 'decremented',
      min_value: minValue,
      max_value: maxValue,
    });
  };

  const handleContinue = () => {
    if (currentValue) {
      onContinue();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <View style={styles.content}>
        <View style={[styles.inputContainer, { backgroundColor: colors.onboardingCardBackground }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.onboardingBackground }]}
            onPress={() => handleIncrement(false)}
            disabled={currentValue === minValue}
          >
            <Minus size={24} color={currentValue === minValue ? colors.muted : colors.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.value, { color: colors.text }]}>
            {currentValue || minValue} {unit}
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.onboardingBackground }]}
            onPress={() => handleIncrement(true)}
            disabled={currentValue === maxValue}
          >
            <Plus size={24} color={currentValue === maxValue ? colors.muted : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {infoCard && <InfoCard title={infoCard.title} text={infoCard.text} />}

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: currentValue ? colors.primary : colors.continueButtonDisabledBg }
        ]}
        onPress={handleContinue}
        disabled={!currentValue}
      >
        <Text style={[
          styles.continueButtonText,
          { color: currentValue ? colors.ctaText : colors.muted }
        ]}>
          Continue
        </Text>
        <ArrowRight size={20} color={currentValue ? colors.ctaText : colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  value: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
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
});