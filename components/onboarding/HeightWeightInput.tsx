import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface Props {
  onContinue: () => void;
  showMetricToggle?: boolean;
}

export default function HeightWeightInput({ onContinue, showMetricToggle = true }: Props) {
  const { height, weight, heightUnit, weightUnit, setHeight, setWeight, setHeightUnit, setWeightUnit } = useOnboarding();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isMetric, setIsMetric] = useState(heightUnit === 'metric' || weightUnit === 'metric');
  const [localHeight, setLocalHeight] = useState(height || 70);
  const [localWeight, setLocalWeight] = useState(weight || 160);

  // Initialize units if not set
  useEffect(() => {
    if (!heightUnit) {
      setHeightUnit(isMetric ? 'metric' : 'imperial');
    }
    if (!weightUnit) {
      setWeightUnit(isMetric ? 'metric' : 'imperial');
    }
  }, [heightUnit, weightUnit, isMetric, setHeightUnit, setWeightUnit]);

  const formatHeight = (value: number) => {
    if (isMetric) {
      return `${value} cm`;
    } else {
      const feet = Math.floor(value / 12);
      const inches = value % 12;
      return `${feet}'${inches}"`;
    }
  };

  const formatWeight = (value: number) => {
    if (isMetric) {
      return `${value} kg`;
    } else {
      return `${value} lbs`;
    }
  };

  const handleHeightChange = (increment: boolean) => {
    setLocalHeight(current => {
      const step = isMetric ? 1 : 1; // 1cm or 1 inch
      const min = isMetric ? 120 : 48; // 120cm or 4'
      const max = isMetric ? 220 : 96; // 220cm or 8'
      const newValue = increment ? current + step : current - step;
      return Math.min(Math.max(newValue, min), max);
    });
  };

  const handleWeightChange = (increment: boolean) => {
    setLocalWeight(current => {
      const step = isMetric ? 1 : 1; // 1kg or 1lb
      const min = isMetric ? 40 : 80; // 40kg or 80lbs
      const max = isMetric ? 180 : 400; // 180kg or 400lbs
      const newValue = increment ? current + step : current - step;
      return Math.min(Math.max(newValue, min), max);
    });
  };

  const handleMetricToggle = () => {
    setIsMetric(current => {
      const newIsMetric = !current;
      if (newIsMetric) {
        // Convert to metric
        setLocalHeight(Math.round(localHeight * 2.54)); // inches to cm
        setLocalWeight(Math.round(localWeight * 0.453592)); // lbs to kg
        setHeightUnit('metric');
        setWeightUnit('metric');
      } else {
        // Convert to imperial
        setLocalHeight(Math.round(localHeight / 2.54)); // cm to inches
        setLocalWeight(Math.round(localWeight / 0.453592)); // kg to lbs
        setHeightUnit('imperial');
        setWeightUnit('imperial');
      }
      return newIsMetric;
    });
  };

  const handleContinue = () => {
    setHeight(localHeight);
    setWeight(localWeight);
    // Units are already set in handleMetricToggle or useEffect
    onContinue();
  };

  return (
    <View style={{ backgroundColor: colors.onboardingBackground, flex: 1 }}>
      {showMetricToggle && (
        <View style={styles.metricToggle}>
          <Text style={[styles.metricLabel, { color: colors.label }]} >Imperial</Text>
          <Switch
            value={isMetric}
            onValueChange={handleMetricToggle}
            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
            thumbColor={isMetric ? colors.ctaBg : colors.label}
          />
          <Text style={[styles.metricLabel, { color: colors.label }]}>Metric</Text>
        </View>
      )}

      <View style={styles.measurementContainer}>
        <View style={styles.measurement}>
          <Text style={[styles.label, { color: colors.label }]}>Height</Text>
          <View style={[styles.controls, { backgroundColor: colors.onboardingCardBackground }]}> 
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.buttonBg }]}
              onPress={() => handleHeightChange(false)}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.value, { color: colors.value }]}>{formatHeight(localHeight)}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.buttonBg }]}
              onPress={() => handleHeightChange(true)}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.measurement}>
          <Text style={[styles.label, { color: colors.label }]}>Weight</Text>
          <View style={[styles.controls, { backgroundColor: colors.onboardingCardBackground }]}> 
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.buttonBg }]}
              onPress={() => handleWeightChange(false)}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.value, { color: colors.value }]}>{formatWeight(localWeight)}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.buttonBg }]}
              onPress={() => handleWeightChange(true)}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={[styles.continueButton, { backgroundColor: colors.ctaBg }]} onPress={handleContinue}>
        <Text style={[styles.continueButtonText, { color: colors.ctaText }]}>Continue</Text>
        <ArrowRight size={20} color={colors.ctaText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  metricToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  metricLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  measurementContainer: {
    gap: 24,
    marginBottom: 32,
  },
  measurement: {
    gap: 12,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  controls: {
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
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
  },
  value: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    textAlign: 'center',
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