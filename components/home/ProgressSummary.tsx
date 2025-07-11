import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { useHabits } from '@/contexts/HabitContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import MiniChart from '@/components/home/MiniChart';
import ProjectionChart from '@/components/ProjectionChart';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { getTLevelHistory, TLevelHistoryEntry } from '@/lib/supabase/progress';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';

// TODO: Move to a feature flag system when implemented
const USE_PROJECTION_CHART_ONLY = false;

export interface ProgressSummaryRef {
  refreshData: () => Promise<void>;
}

const ProgressSummary = forwardRef<ProgressSummaryRef>((props, ref) => {
  const { user, updateUser } = useUser();
  const { completedCount, habits } = useHabits();
  const { progressHistory } = useProgress();
  const { theme } = useTheme();
  const { addBreadcrumb } = useSentry();
  const colors = Colors[theme];
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; level: number }[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  
  const totalHabits = habits.length;

  const loadChartData = async () => {
    try {
      // Add authentication guard
      if (!user.id) {
        addBreadcrumb({
          message: 'No user ID, skipping T-level data fetch',
          category: 'data_loading'
        });
        setChartData([]);
        setWeeklyProgress(0);
        return;
      }

      setIsLoading(true);
      const history = await getTLevelHistory(user.id, 7);
      
      // Calculate weekly progress percentage
      if (history.length >= 2) {
        const firstValue = history[0].estimate;
        const lastValue = history[history.length - 1].estimate;
        const progressPercent = Math.round(((lastValue - firstValue) / firstValue) * 100);
        setWeeklyProgress(progressPercent);
      }

      const formattedData = history.map(entry => ({
        day: new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
        level: entry.estimate
      }));
      setChartData(formattedData);
    } catch (error) {
      logError('Failed to load T-level history', error instanceof Error ? error : new Error(String(error)), {
        user_id: user.id,
        context: 'progress_summary_t_level_loading'
      });
      setChartData([]);
      setWeeklyProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [user.id]);

  // Expose the refresh method via ref
  useImperativeHandle(ref, () => ({
    refreshData: loadChartData
  }));

  // Convert weekly data to projection chart format
  const projectionData = user.projectionData;
  
  const goToProgress = () => {
    router.push('/progress');
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    // If we have 6 or more data points, show the mini chart
    if (chartData.length >= 6) {
      return (
        <MiniChart
          data={chartData}
          height={120}
        />
      );
    }

    // If we have projection data, show the projection chart
    if (projectionData.length > 0) {
      return (
        <ProjectionChart
          points={projectionData}
          height={120}
        />
      );
    }

    // If we have neither sufficient chart data nor projection data, show no data message
    return (
      <View style={styles.noDataContainer}>
        <Text style={[styles.noDataText, { color: colors.muted }]}>
          No T-level data available yet
        </Text>
      </View>
    );
  };

  const renderTrendIcon = () => {
    if (isLoading) return null;
    
    if (weeklyProgress >= 0) {
      return (
        <>
          <TrendingUp size={14} color={colors.success} />
          <Text style={[styles.trendText, { color: colors.success }]}>
            +{weeklyProgress}% this week
          </Text>
        </>
      );
    } else {
      return (
        <>
          <TrendingDown size={14} color={colors.error} />
          <Text style={[styles.trendText, { color: colors.error }]}>
            {weeklyProgress}% this week
          </Text>
        </>
      );
    }
  };

  return (
    <Pressable 
      onPress={goToProgress} 
      style={({ pressed }) => [
        styles.container, 
        { 
          backgroundColor: colors.cardBackground,
          opacity: pressed ? 0.9 : 1 
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.row}>
          <View style={styles.mainStat}>
            <Text style={[styles.label, { color: colors.muted }]}>
              📊 Est. T-Level
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user.tLevel}
              <Text style={[styles.unit, { color: colors.muted }]}> ng/L</Text>
            </Text>
            <View style={styles.trendContainer}>
              {renderTrendIcon()}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.streakContainer}>
            <Text style={[styles.label, { color: colors.muted }]}>
              🔥 Current Streak
            </Text>
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {user.streakDays} days
            </Text>
            <Text style={[styles.completionText, { color: colors.muted }]}>
              {completedCount}/{totalHabits} today
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainStat: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 50,
    marginHorizontal: 16,
  },
  streakContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
  streakValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  unit: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  completionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 8,
    width: '100%',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});

export default ProgressSummary;