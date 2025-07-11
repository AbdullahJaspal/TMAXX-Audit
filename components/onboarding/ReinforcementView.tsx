import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import Colors from '@/constants/Colors';

interface Props {
  content: {
    highlights?: Array<{
      icon: string | any; // string from API, component from fallback
      text: string;
    }>;
    notice?: string;
    subheading?: string;
    explanation?: string;
  };
  onContinue: () => void;
}

export default function ReinforcementView({ content, onContinue }: Props) {
  const { highlights, notice, subheading, explanation } = content;
  const { theme } = useTheme();
  const { getIconComponent } = useOnboardingScreens();
  const colors = Colors[theme];

  return (
    <View style={{ flex: 1, backgroundColor: colors.onboardingBackground }}>
      {highlights && (
        <View style={styles.highlights}>
          {highlights.map((highlight, index) => {
            // Handle both string (API) and component (fallback) icons
            const Icon = typeof highlight.icon === 'string' 
              ? getIconComponent(highlight.icon)
              : highlight.icon;
              
            return (
              <View key={index} style={[styles.highlight, { backgroundColor: colors.onboardingCardBackground }]}>
                <Icon size={24} color={colors.primary} />
                <Text style={[styles.highlightText, { color: colors.text }]}>{highlight.text}</Text>
              </View>
            );
          })}
        </View>
      )}

      {notice && (
        <Text style={[styles.notice, { color: colors.muted }]}>{notice}</Text>
      )}

      {subheading && (
        <Text style={[styles.subheading, { color: colors.text }]}>{subheading}</Text>
      )}
      
      {explanation && (
        <Text style={[styles.explanation, { color: colors.muted }]}>{explanation}</Text>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onContinue}>
        <Text style={[styles.buttonText, { color: colors.ctaText }]}>Continue</Text>
        <ArrowRight size={20} color={colors.ctaText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  highlights: {
    gap: 20,
    marginBottom: 32,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  highlightText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  notice: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  subheading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    marginBottom: 12,
  },
  explanation: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
});