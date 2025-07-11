import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowRight, Check } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import Colors from '@/constants/Colors';

interface Props {
  onContinue: () => void;
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  multiSelect?: boolean;
  field: string; // The field name in OnboardingContext to update
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

export default function MultipleChoiceInput({ onContinue, options, multiSelect = false, field, screenId, screenTitle, variant }: Props) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();
  
  // Get the current value and setter from context
  const context = useOnboarding();
  const currentValue = context[field as keyof typeof context];
  const setterName = `set${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof typeof context;
  const setValue = context[setterName] as (value: any) => void;

  // Initialize local state with current context value
  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    if (multiSelect) {
      return Array.isArray(currentValue) ? (currentValue as string[]) : [];
    } else {
      return currentValue ? [String(currentValue)] : [];
    }
  });

  // Update context when selectedValues change
  useEffect(() => {
    if (multiSelect) {
      setValue(selectedValues);
    } else {
      setValue(selectedValues[0] || null);
    }
  }, [selectedValues, multiSelect, setValue]);

  const handleSelect = (value: string) => {
    // Track selection
    track(ANALYTICS_EVENTS.ONBOARDING_SELECTION_MADE, {
      screen_id: screenId,
      screen_title: screenTitle,
      field: field,
      selection_value: value,
      selection_label: options.find(opt => opt.value === value)?.label,
      multi_select: multiSelect,
      variant: variant || 'default',
      action: selectedValues.includes(value) ? 'deselected' : 'selected',
    });

    if (multiSelect) {
      setSelectedValues(current => 
        current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      );
    } else {
      setSelectedValues([value]);
    }
  };

  const handleContinue = () => {
    onContinue();
  };

  const isSelected = (value: string) => selectedValues.includes(value);

  const canContinue = selectedValues.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <ScrollView style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              { backgroundColor: colors.onboardingCardBackground },
              isSelected(option.value) && { backgroundColor: colors.shadedPrimary },
              index === 0 && styles.optionFirst,
              index === options.length - 1 && styles.optionLast,
            ]}
            onPress={() => handleSelect(option.value)}>
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={[
                  styles.optionLabel,
                  { color: colors.text },
                  isSelected(option.value) && { color: colors.primary }
                ]}>
                  {option.label}
                </Text>
                {isSelected(option.value) && (
                  <Check size={20} color={colors.primary} />
                )}
              </View>
              {option.description && (
                <Text style={[
                  styles.optionDescription,
                  { color: colors.muted }
                ]}>
                  {option.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: colors.primary },
          !canContinue && { backgroundColor: colors.continueButtonDisabledBg }
        ]}
        onPress={handleContinue}
        disabled={!canContinue}>
        <Text style={[
          styles.continueButtonText,
          { color: colors.ctaText },
          !canContinue && { color: colors.continueButtonTextDisabled }
        ]}>
          Continue
        </Text>
        <ArrowRight
          size={20}
          color={canContinue ? colors.ctaText : colors.continueButtonTextDisabled}
        />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionFirst: {
    marginTop: 8,
  },
  optionLast: {
    marginBottom: 24,
  },
  optionContent: {
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    flex: 1,
  },
  optionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
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