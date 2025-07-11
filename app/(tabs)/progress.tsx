import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { useHabits } from '@/contexts/HabitContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useScreenTracking } from '@/components/analytics/withScreenTracking';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import { SCREEN_NAMES } from '@/lib/analytics';
import TrendChart from '@/components/progress/TrendChart';
import DonutChart from '@/components/progress/DonutChart';
import { TrendingUp, ArrowUpRight, Clock } from 'lucide-react-native';
import { getTLevelHistory, getHabitAdherence, getTopHabitInsights, checkProgressAvailability, HabitAdherence, HabitInsight, ProgressAvailability } from '@/lib/supabase/progress';
import { useUser } from '@/contexts/UserContext';

export default function ProgressScreen() {
  const { progressHistory, getHabitImpact } = useProgress();
  const { habits } = useHabits();
  const { theme } = useTheme();
  const { user } = useUser();
  const { addBreadcrumb } = useSentry();
  const colors = Colors[theme];
  const [tLevelHistory, setTLevelHistory] = useState<{ estimate: number; created_at: string }[]>([]);
  const [habitAdherence, setHabitAdherence] = useState<HabitAdherence[]>([]);
  const [habitInsights, setHabitInsights] = useState<HabitInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [progressAvailability, setProgressAvailability] = useState<ProgressAvailability | null>(null);

  // Track screen view
  useScreenTracking(SCREEN_NAMES.PROGRESS);

  useEffect(() => {
    // Add authentication guard
    if (!user.id) {
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        addBreadcrumb({
          message: 'Loading progress screen data',
          category: 'data_loading'
        });
        const [history, adherence, insights, availability] = await Promise.all([
          getTLevelHistory(user.id, 90),
          getHabitAdherence(user.id),
          getTopHabitInsights(user.id),
          checkProgressAvailability(user.id)
        ]);
        setTLevelHistory(history);
        setHabitAdherence(adherence);
        setHabitInsights(insights);
        setProgressAvailability(availability);
      } catch (error) {
        logError('Failed to load progress screen data', error instanceof Error ? error : new Error(String(error)), {
          user_id: user.id,
          context: 'progress_screen_data_loading'
        });
      } finally {
        setIsLoading(false);
        setIsLoadingHabits(false);
        setIsLoadingInsights(false);
      }
    };

    fetchData();
  }, [user.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0, backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!progressAvailability?.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              Your Progress
            </Text>
            
            <View style={[styles.unavailableCard, { backgroundColor: colors.cardBackground }]}>
              <Clock size={32} color={colors.primary} style={styles.unavailableIcon} />
              <Text style={[styles.unavailableTitle, { color: colors.text }]}>
                Progress Coming Soon
              </Text>
              <Text style={[styles.unavailableDescription, { color: colors.muted }]}>
                {progressAvailability?.daysRemaining === 7 
                  ? "Start tracking your habits to unlock your progress dashboard."
                  : `Your progress dashboard will be available in ${progressAvailability?.daysRemaining} day${progressAvailability?.daysRemaining === 1 ? '' : 's'}.`}
              </Text>
              <Text style={[styles.unavailableSubtext, { color: colors.muted }]}>
                We need at least 7 days of data to provide meaningful insights about your habits and their impact on your testosterone levels.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Calculate stats for the last 90 days
  const last90Days = tLevelHistory;
  const highestLevel = last90Days.length > 0 ? Math.max(...last90Days.map(day => day.estimate)) : 0;
  const lowestLevel = last90Days.length > 0 ? Math.min(...last90Days.map(day => day.estimate)) : 0;
  const averageLevel = last90Days.length > 0 
    ? Math.round(last90Days.reduce((acc, day) => acc + day.estimate, 0) / last90Days.length)
    : 0;

  // Calculate date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const endDate = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  // Get consistent and inconsistent habits
  const consistentHabits = habitAdherence.filter(habit => habit.is_consistent);
  const inconsistentHabits = habitAdherence.filter(habit => !habit.is_consistent);

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Your Progress
          </Text>
          
          <View style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.chartTitleContainer}>
              <TrendingUp size={24} color={colors.success} style={styles.trendIcon} />
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Your T is Trending Up
              </Text>
            </View>
            <Text style={[styles.dateRange, { color: colors.muted }]}>
              Testosterone Trend since {formatDate(startDate)}
            </Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : last90Days.length > 0 ? (
              <TrendChart 
                data={last90Days.map(day => ({
                  day: day.created_at,
                  level: day.estimate
                }))}
                height={220}
                showTitle={false}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: colors.muted }]}>
                  No T-level data available yet
                </Text>
              </View>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Low</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{lowestLevel}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Average</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{averageLevel}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.text }]}>High</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{highestLevel}</Text>
              </View>
            </View>
          </View>
          
          {isLoadingInsights ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : habitInsights.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <ArrowUpRight size={20} color={colors.success} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  What's Helping Most
                </Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: colors.cardBackground }]}>
                {habitInsights.map((insight, index) => (
                  <View 
                    key={insight.habit_id} 
                    style={[
                      styles.impactItem,
                      index < habitInsights.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }
                    ]}
                  >
                    <View style={styles.impactRank}>
                      <Text style={[styles.rankNumber, { color: colors.text }]}>
                        {insight.rank}
                      </Text>
                    </View>
                    <View style={styles.impactInfo}>
                      <Text style={[styles.impactTitle, { color: colors.text }]}>
                        {insight.name}
                      </Text>
                      <Text style={[styles.impactDescription, { color: colors.muted }]}>
                        {insight.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isLoadingHabits ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {consistentHabits.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <TrendingUp size={20} color={colors.success} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Most Consistent Habits
                    </Text>
                  </View>
                  <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    {consistentHabits.map(habit => (
                      <View key={habit.habit_id} style={[
                        styles.habitItem,
                        { borderBottomColor: colors.border }
                      ]}>
                        <View style={styles.habitInfo}>
                          <Text style={styles.habitIcon}>{habit.icon}</Text>
                          <View>
                            <Text style={[styles.habitName, { color: colors.text }]}>
                              {habit.name}
                            </Text>
                            <Text style={[styles.habitCategory, { color: colors.muted }]}>
                              {habit.category}
                            </Text>
                          </View>
                        </View>
                        <DonutChart
                          percentage={habit.adherence_percent}
                          color={colors.success}
                          backgroundColor={colors.success + '20'}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {inconsistentHabits.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <TrendingUp size={20} color={colors.error} style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Needs Improvement
                    </Text>
                  </View>
                  <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    {inconsistentHabits.map(habit => (
                      <View key={habit.habit_id} style={[
                        styles.habitItem,
                        { borderBottomColor: colors.border }
                      ]}>
                        <View style={styles.habitInfo}>
                          <Text style={styles.habitIcon}>{habit.icon}</Text>
                          <View>
                            <Text style={[styles.habitName, { color: colors.text }]}>
                              {habit.name}
                            </Text>
                            <Text style={[styles.habitCategory, { color: colors.muted }]}>
                              {habit.category}
                            </Text>
                          </View>
                        </View>
                        <DonutChart
                          percentage={habit.adherence_percent}
                          color={colors.error}
                          backgroundColor={colors.error + '20'}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
          
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendIcon: {
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'left',
  },
  dateRange: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  impactCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  impactRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  impactInfo: {
    flex: 1,
  },
  impactTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  impactDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 26,
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
    flexShrink: 0,
  },

  habitName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  habitCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  unavailableCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unavailableIcon: {
    marginBottom: 16,
  },
  unavailableTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  unavailableDescription: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  unavailableSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});