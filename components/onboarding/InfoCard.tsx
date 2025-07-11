import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  title: string;
  text: string;
}

export default function InfoCard({ title, text }: Props) {
  const { theme } = useTheme();
  const colors = {
    light: { bg: 'rgba(0, 163, 255, 0.1)', title: '#00A3FF', text: '#1a1a1a' },
    dark: { bg: 'rgba(37, 99, 235, 0.18)', title: '#60a5fa', text: '#fff' }
  };
  return (
    <View style={[styles.infoCard, { backgroundColor: colors[theme].bg }]}>
      <Text style={[styles.infoTitle, { color: colors[theme].title }]}>{title}</Text>
      <Text style={[styles.infoText, { color: colors[theme].text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
});