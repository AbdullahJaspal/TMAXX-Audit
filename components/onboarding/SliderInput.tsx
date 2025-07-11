import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface Props {
  onContinue: () => void;
  sliderConfig: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
}

export default function SliderInput({ onContinue, sliderConfig }: Props) {
  const { exerciseFrequency, setExerciseFrequency } = useOnboarding();
  const [value, setValue] = useState(exerciseFrequency || sliderConfig.min);
  const { theme } = useTheme();
  const colors = Colors[theme];

  const handleIncrement = (increment: boolean) => {
    setValue(current => {
      const newValue = increment ? current + sliderConfig.step : current - sliderConfig.step;
      return Math.min(Math.max(newValue, sliderConfig.min), sliderConfig.max);
    });
  };

  const handleContinue = () => {
    setExerciseFrequency(value);
    onContinue();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.onboardingCardBackground }]}
            onPress={() => handleIncrement(false)}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.value, { color: colors.text }]}>{value} {sliderConfig.unit}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.onboardingCardBackground }]}
            onPress={() => handleIncrement(true)}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}>
          <Text style={[styles.continueButtonText, { color: colors.background }]}>Continue</Text>
          <ArrowRight size={20} color={colors.background} />
        </TouchableOpacity>
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginHorizontal: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});