import React, { useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface InitialSplashScreenProps {
  onInitialized: () => void;
}

export default function InitialSplashScreen({ onInitialized }: InitialSplashScreenProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const colors = Colors[theme];
  const logoSource = theme === 'dark' 
    ? require('@/assets/images/NameLogoDark.png')
    : require('@/assets/images/NameLogoMain.png');

  // Call onInitialized after a minimum delay for smooth UX
  useEffect(() => {
    const timer = setTimeout(() => {
      onInitialized();
    }, 1500); // Minimum 1.5 seconds for initial splash

    return () => clearTimeout(timer);
  }, [onInitialized]);

  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
        style={[styles.logo, { width: width * 0.8 }]}
        resizeMode="contain"
      />
      <Text style={[styles.tagline, { color: colors.text }]}>Discipline Builds Biology</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    height: undefined,
    aspectRatio: 2.5, // Adjust this value based on your logo's aspect ratio
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 20,
  },
}); 