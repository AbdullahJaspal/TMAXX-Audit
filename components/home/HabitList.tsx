import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHabits } from '@/contexts/HabitContext';
import HabitItem from './HabitItem';
import Animated, { Layout } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

export default function HabitList() {
  const { habits, completedCount } = useHabits();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Sort habits with incomplete ones first
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Then maintain original order for same completion status
      return habits.indexOf(a) - habits.indexOf(b);
    });
  }, [habits]);

  const progressPercentage = habits && habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.progressContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.progressHeader}>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.progressCount, { color: colors.text }]}>
              {completedCount}/{habits?.length || 0}
            </Text>
            <Text style={[styles.completedText, { color: colors.muted }]}>
              completed
            </Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.tint,
                width: `${progressPercentage}%`,
              }
            ]} 
          />
        </View>
      </View>

      <Animated.View layout={Layout.springify()}>
        {sortedHabits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  completedText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease-in-out',
  },
});