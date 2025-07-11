import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useInitialization } from '@/contexts/InitializationContext';
import Colors from '@/constants/Colors';

interface BrandedSplashScreenProps {
  onInitialized: () => void;
}

export default function BrandedSplashScreen({ onInitialized }: BrandedSplashScreenProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  
  // Update hook usage
  const { state, error, progress } = useInitialization();

  // Add helper
  const isInitializing = state === 'initializing' || state === 'waiting_for_session';
  const isInitialized = state === 'completed';
  
  const colors = Colors[theme];
  const logoSource = theme === 'dark' 
    ? require('@/assets/images/NameLogoDark.png')
    : require('@/assets/images/NameLogoMain.png');

  // Track when initialization started and minimum duration
  const [startTime] = useState(Date.now());
  const [canProceed, setCanProceed] = useState(false);

  // Remove initialization trigger - keep only progress display logic
  // useEffect(() => {
  //   initialize();
  // }, [initialize]);

  // Check if we can proceed (initialization complete + minimum duration)
  useEffect(() => {
    if (isInitialized && !isInitializing) {
      const elapsed = Date.now() - startTime;
      const minimumDuration = 1000; // 1 second
      
      if (elapsed >= minimumDuration) {
        setCanProceed(true);
      } else {
        // Wait for the remaining time
        const remainingTime = minimumDuration - elapsed;
        const timer = setTimeout(() => {
          setCanProceed(true);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isInitialized, isInitializing, startTime]);

  // Call onInitialized when we can proceed
  useEffect(() => {
    if (canProceed) {
      onInitialized();
    }
  }, [canProceed, onInitialized]);

  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
        style={[styles.logo, { width: width * 0.8 }]}
        resizeMode="contain"
      />
      <Text style={[styles.tagline, { color: colors.text }]}>Discipline Builds Biology</Text>
      
      {/* Show initialization progress */}
      {(isInitializing || isInitialized) && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {progress.step}
          </Text>
        </View>
      )}
      
      {/* Show error if initialization failed */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}
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
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
}); 