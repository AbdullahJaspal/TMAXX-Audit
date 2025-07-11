import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Hand as HandFist, Zap } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

type BoostNotificationModalProps = {
  visible: boolean;
  onClose: () => void;
  boosterName: string;
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function BoostNotificationModal({
  visible,
  onClose,
  boosterName,
}: BoostNotificationModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const zapScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withSpring(1);
      translateY.value = withSpring(0, { damping: 15 });
      
      // Create pulsing effect for the zap icons
      zapScale.value = withSequence(
        withDelay(500, withSpring(1.2)),
        withSpring(1),
        withDelay(1000, withSpring(1.2)),
        withSpring(1)
      );

      // Auto-close after 3 seconds
      const timeoutId = setTimeout(() => {
        runOnJS(onClose)();
      }, 3000);

      return () => clearTimeout(timeoutId);
    } else {
      scale.value = 0.3;
      opacity.value = 0;
      translateY.value = 50;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const zapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zapScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <AnimatedTouchableOpacity
          style={[
            styles.container,
            { backgroundColor: colors.cardBackground },
            containerStyle,
          ]}
          onPress={onClose}
          activeOpacity={0.9}
        >
          <View style={styles.content}>
            <View style={styles.iconRow}>
              <Animated.View style={zapStyle}>
                <Zap size={24} color={colors.tint} />
              </Animated.View>
              <View style={[styles.boostIcon, { backgroundColor: colors.tint }]}>
                <HandFist size={32} color="#fff" />
              </View>
              <Animated.View style={zapStyle}>
                <Zap size={24} color={colors.tint} />
              </Animated.View>
            </View>

            <Text style={[styles.message, { color: colors.text }]}>
              <Text style={styles.name}>{boosterName}</Text> just boosted your energy!
            </Text>

            <Text style={[styles.subtext, { color: colors.muted }]}>
              Keep crushing it! 💪
            </Text>
          </View>
        </AnimatedTouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    width: Dimensions.get('window').width - 48,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  boostIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontFamily: 'Inter-Bold',
  },
  subtext: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});