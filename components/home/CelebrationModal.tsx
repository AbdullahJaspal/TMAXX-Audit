import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type CelebrationModalProps = {
  visible: boolean;
  onClose: () => void;
  completedCount: number;
  totalCount: number;
};

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  completedCount,
  totalCount,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}> 
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}> 
              <TrendingUp size={32} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Amazing Work! 🎉</Text>
            <Text style={[styles.message, { color: colors.muted }]}>You've completed all {totalCount} habits today! Your dedication is making a real difference in your T levels.</Text>
            <View style={[styles.statsContainer, { backgroundColor: colors.background }]}> 
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.success }]}>+8%</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Weekly Increase</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.success }]}>4</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Day Streak</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Keep Going Strong!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Dimensions.get('window').width - 48,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default CelebrationModal;