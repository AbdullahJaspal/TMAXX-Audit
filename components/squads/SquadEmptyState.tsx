import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation, useAnimatedStyle } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useSquad } from '@/contexts/SquadContext';

type SquadEmptyStateProps = {
  onCreateSquad: () => void;
  onJoinSquad: () => void;
  onInvite: () => void;
  refreshing: boolean;
  onRefresh: () => void;
};

const SquadEmptyState: React.FC<SquadEmptyStateProps> = ({
  onCreateSquad,
  onJoinSquad,
  onInvite,
  refreshing,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const { createSquad } = useSquad();
  const colors = Colors[theme];
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(glowOpacity);
    };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
          colors={[colors.tint]}
        />
      }
    >
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: '#000' }]}> 
          <Image
            source={require('@/assets/images/squads.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Your Squad is Waiting</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Build better habits, faster — with friends pushing you, encouraging you, and competing with you.</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint, shadowColor: colors.tint }]}
            onPress={onCreateSquad}
          >
            <Text style={styles.primaryButtonText}>Create Your Squad</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.tint }]}
            onPress={onJoinSquad}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>Join with a Squad Code</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.tip, { color: colors.muted }]}>
          <Text style={styles.tipEmoji}>🔥</Text> People who share their goals with others are up to 95% more likely to succeed. {'\n'}Don't go it alone. Build your Squad.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 0,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.5,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    maxWidth: 420,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 420,
    gap: 14,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  tip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 420,
  },
  tipEmoji: {
    fontSize: 16,
    marginRight: 2,
  },
});

export default SquadEmptyState;