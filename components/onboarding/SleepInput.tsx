import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export default function SleepInput({ onContinue }: { onContinue: () => void }) {
  const { sleep, setSleep } = useOnboarding();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const sleepOptions = [4, 5, 6, 7, 8, 9, 10];

  const handleSelect = (hours: number) => {
    setSleep(hours);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          How many hours do you sleep per night?
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          This helps us understand your sleep patterns and their impact on testosterone levels.
        </Text>

        <View style={styles.optionsContainer}>
          {sleepOptions.map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.option,
                { backgroundColor: colors.onboardingCardBackground, borderColor: colors.border },
                sleep === hours && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleSelect(hours)}
            >
              <Text style={[
                styles.optionText,
                { color: colors.text },
                sleep === hours && { color: colors.primary, fontFamily: 'Inter-SemiBold' }
              ]}>
                {hours} hours
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: sleep ? colors.primary : colors.continueButtonDisabledBg }
        ]}
        onPress={onContinue}
        disabled={!sleep}
      >
        <Text style={[
          styles.continueButtonText,
          { color: sleep ? colors.ctaText : colors.continueButtonDisabledText }
        ]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  option: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  optionText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
  },
  continueButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});