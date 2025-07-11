import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useHabits, Habit } from '@/contexts/HabitContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import { ANALYTICS_EVENTS } from '@/lib/analytics';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';

type HabitItemProps = {
  habit: Habit;
  onComplete?: () => void;
};

const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  onComplete,
}) => {
  const { toggleHabitCompletion } = useHabits();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();
  const { addBreadcrumb } = useSentry();

  const isWeeklyGoalMet =
    habit.frequency !== 'Daily' &&
    habit.completions_this_week >= parseInt(habit.frequency.split('x')[0]);

  const renderFrequencyIndicator = () => {
    if (habit.frequency === 'Daily') {
      return (
        <Text style={[styles.frequencyText, { color: colors.muted }]}>
          Daily Habit
        </Text>
      );
    }

    const totalDays = parseInt(habit.frequency.split('x')[0]);
    const completedDays = Math.min(habit.completions_this_week, totalDays);
    const isMet = completedDays >= totalDays;

    return (
      <View style={styles.frequencyRow}>
        <View style={styles.frequencyDotsContainer}>
          {Array.from({ length: totalDays }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.frequencyDot,
                {
                  backgroundColor: i < completedDays ? colors.tint : 'transparent',
                  borderColor: colors.tint,
                },
              ]}
            />
          ))}
        </View>
        {isMet && (
          <Text style={[styles.successText, { color: colors.success }]}>
            Weekly goal complete! 🎯
          </Text>
        )}
      </View>
    );
  };

  const handleToggle = async () => {
    try {
      // Track habit interaction attempt
      track(ANALYTICS_EVENTS.USER_ACTION, {
        action: 'habit_toggle_attempted',
        habit_id: habit.id,
        habit_name: habit.name,
        habit_category: habit.category,
        current_completion_status: habit.isCompletedToday,
        current_streak: habit.streak,
        screen: 'home',
      });
      
      await toggleHabitCompletion(habit.id);
      if (!habit.completed && onComplete) {
        onComplete();
      }
    } catch (error) {
      // Track failed habit interaction
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_context: 'habit_toggle',
        habit_id: habit.id,
        habit_name: habit.name,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Log error to Sentry
      logError('Failed to toggle habit', error instanceof Error ? error : new Error(String(error)), {
        habit_id: habit.id,
        habit_name: habit.name,
        habit_category: habit.category,
        current_completion_status: habit.isCompletedToday,
        context: 'habit_item_toggle'
      });
    }
  };

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={Layout.springify()}
      style={[
        styles.container,
        {
          backgroundColor: isWeeklyGoalMet ? colors.success + '15' : colors.cardBackground,
          borderColor: isWeeklyGoalMet ? colors.success : 'transparent',
          borderWidth: isWeeklyGoalMet ? 1 : 0,
        },
        isWeeklyGoalMet && styles.noShadow,
      ]}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.mainContent}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleToggle}
            style={[
              styles.checkbox,
              {
                backgroundColor: habit.isCompletedToday ? colors.tint : 'transparent',
                borderColor: habit.isCompletedToday ? colors.tint : colors.border,
              },
            ]}
          >
            {habit.isCompletedToday && <Check size={16} color="#FFFFFF" />}
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  textDecorationLine: habit.isCompletedToday ? 'line-through' : 'none',
                },
              ]}
            >
              {habit.name}
            </Text>
            <Text
              style={[styles.description, { color: colors.muted }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {habit.description}
            </Text>
          </View>

          <View style={[styles.streakBadge, { backgroundColor: colors.tint + '20' }]}>
            <Text style={[styles.streakNumber, { color: colors.tint }]}>
              {habit.streak} 🔥
            </Text>
          </View>
        </View>

        <View style={styles.frequencyContainer}>{renderFrequencyIndicator()}</View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noShadow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  frequencyContainer: {
    marginTop: 'auto',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  frequencyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  frequencyDotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  frequencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  successText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  streakNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 20,
  },
});

export default HabitItem;