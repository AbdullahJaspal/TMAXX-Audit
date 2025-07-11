import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar, RefreshControl } from 'react-native';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { useHabits } from '@/contexts/HabitContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useScreenTracking } from '@/components/analytics/withScreenTracking';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import { ANALYTICS_EVENTS, SCREEN_NAMES } from '@/lib/analytics';
import HabitList from '@/components/home/HabitList';
import ProgressSummary, { ProgressSummaryRef } from '@/components/home/ProgressSummary';
import CelebrationModal from '@/components/home/CelebrationModal';
import { router } from 'expo-router';
import { getUserHabits } from '@/lib/supabase/habits';

export default function TodayScreen() {
  const { user, refreshUser } = useUser();
  const { session } = useAuth();
  const { habits = [], completedCount = 0, addHabit, setHabits } = useHabits();
  const { updateProgress } = useProgress();
  const { theme } = useTheme();
  const { track, trackFeatureUsage } = useAnalytics();
  const { addBreadcrumb } = useSentry();
  const colors = Colors[theme];
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Track screen view
  useScreenTracking(SCREEN_NAMES.HOME);

  // Reference to ProgressSummary component for refreshing
  const progressSummaryRef = React.useRef<ProgressSummaryRef>(null);

  // Load habits from Supabase
  const loadHabits = React.useCallback(async () => {
    if (!session?.user.id) return;
    
    try {
      setIsLoading(true);
      // Fetch user's current habits
      const userHabits = await getUserHabits(session.user.id);
      
      // Clear existing habits before adding new ones
      setHabits([]);
      
      // Update the habits context with the fetched habits
      const processedHabits = userHabits
        .filter(habit => habit.name)
        .map(habit => {
          try {
            
            return {
              id: habit.id,
              name: habit.name,
              description: habit.description ?? 'No description provided',
              category: (habit.category ?? 'Movement') as 'Sleep' | 'Movement' | 'Sunlight' | 'Nutrition' | 'Recovery',
              whyItMatters: habit.why_it_matters ?? 'This habit can help improve your overall health and well-being.',
              icon: habit.icon ?? '',
              reminderTime: '09:00',
              is_removable: habit.is_removable ?? false,
              user_habit_id: habit.user_habit_id,
              frequency: (habit.frequency ?? 'Daily') as 'Daily' | '5x Per Week' | '3x Per Week' | '1x Per Week',
              completed: habit.isCompletedToday,
              streak: habit.current_streak ?? 0,
              completions_this_week: habit.completions_this_week ?? 0,
              isCompletedToday: habit.isCompletedToday,
              todayCompletionId: habit.todayCompletionId
            };
          } catch (error) {
            logError('Failed to process individual habit', error instanceof Error ? error : new Error(String(error)), {
              user_id: session?.user.id,
              habit_id: habit.id,
              habit_name: habit.name,
              context: 'home_screen_habit_processing'
            });
            return {
              id: habit.id,
              name: habit.name,
              description: habit.description ?? 'No description provided',
              category: 'Movement' as const,
              whyItMatters: habit.why_it_matters ?? 'This habit can help improve your overall health and well-being.',
              icon: habit.icon ?? '',
              reminderTime: '09:00',
              is_removable: false,
              user_habit_id: habit.user_habit_id,
              frequency: 'Daily' as const,
              completed: false,
              streak: 0,
              completions_this_week: 0,
              isCompletedToday: false,
              todayCompletionId: null
            };
          }
        });

      setHabits(processedHabits);
      
      // Track habit loading
      track(ANALYTICS_EVENTS.FEATURE_USED, {
        feature: 'habit_loading',
        habit_count: processedHabits.length,
        completed_count: processedHabits.filter(h => h.completed).length,
      });
    } catch (error) {
      logError('Failed to load user habits', error instanceof Error ? error : new Error(String(error)), {
        user_id: session?.user.id,
        context: 'home_screen_habit_loading'
      });
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_context: 'habit_loading',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user.id, track]);

  // Initial load
  React.useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Handle pull to refresh - now refreshes all data
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    addBreadcrumb({
      message: 'User pulled to refresh home screen',
      category: 'user_action'
    });
    try {
      // Track refresh action
      track(ANALYTICS_EVENTS.USER_ACTION, {
        action: 'pull_to_refresh',
        screen: 'home',
      });
      
      // Refresh all data in parallel
      await Promise.all([
        loadHabits(),
        refreshUser(),
        progressSummaryRef.current?.refreshData?.()
      ]);
    } catch (error) {
      logError('Failed to refresh home screen data', error instanceof Error ? error : new Error(String(error)), {
        user_id: session?.user.id,
        context: 'home_screen_refresh'
      });
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_context: 'data_refresh',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadHabits, refreshUser, track]);

  // Show celebration modal when all habits are completed
  React.useEffect(() => {
    if (habits.length > 0 && completedCount === habits.length && completedCount > prevCompletedCount) {
      setShowCelebration(true);
      
      // Track all habits completed
      track(ANALYTICS_EVENTS.FEATURE_USED, {
        feature: 'all_habits_completed',
        total_habits: habits.length,
        completed_count: completedCount,
      });
    }
    setPrevCompletedCount(completedCount);
  }, [habits, completedCount, track]);

  // Update progress when habits are completed
  React.useEffect(() => {
    if (!habits || !habits.length) return;

    const today = new Date().toISOString().split('T')[0];
    const completedHabits = habits
      .filter(habit => habit.completed)
      .map(habit => habit.id);
    
    const baseLevel = 350;
    const bonusPerHabit = 25;
    const tLevel = baseLevel + completedHabits.length * bonusPerHabit;
    
    updateProgress(today, tLevel, completedHabits);
  }, [completedCount, habits]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Morning';
    if (hours < 18) return 'Afternoon';
    return 'Evening';
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    track(ANALYTICS_EVENTS.USER_ACTION, {
      action: 'celebration_modal_closed',
      screen: 'home',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0, backgroundColor: colors.background }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      >
        <View style={styles.content}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()} {user?.name || 'Friend'} 👋
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Here's your game plan for today.
          </Text>
          
          <View style={styles.summaryContainer}>
            <ProgressSummary ref={progressSummaryRef} />
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Daily Habits
          </Text>
          
          <HabitList />
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.primary }]}>
              "Small wins add up. Let's keep going."
            </Text>
          </View>
          
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <CelebrationModal
        visible={showCelebration}
        onClose={handleCelebrationClose}
        completedCount={completedCount}
        totalCount={habits.length}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
  },
});