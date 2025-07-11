import { supabase } from './client';

export interface TLevelHistoryEntry {
  estimate: number;
  created_at: string;
}

export interface HabitAdherence {
  habit_id: string;
  name: string;
  category: string;
  icon: string;
  expected_total: number;
  actual_completions: number;
  adherence_percent: number;
  is_consistent: boolean;
}

export interface HabitInsight {
  habit_id: string;
  name: string;
  t_delta: number;
  description: string;
  rank: number;
}

interface HabitInsightWithJoin {
  habit_id: string;
  t_delta: number;
  description: string;
  rank: number;
  habits: {
    name: string;
  } | null;
}

export interface ProgressAvailability {
  isAvailable: boolean;
  daysRemaining: number;
  earliestDate: string | null;
}

/**
 * Retrieves the T-level history for a user over a specified number of days
 * @param userId The ID of the user to get history for
 * @param days The number of days of history to retrieve
 * @returns Array of T-level estimates with their creation dates
 */
export async function getTLevelHistory(userId: string, days: number): Promise<TLevelHistoryEntry[]> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  const { data, error } = await supabase
    .from('t_level_estimates')
    .select('estimate, created_at')
    .eq('user_id', userId)
    .gte('created_at', daysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching T-level history:', error);
    throw error;
  }
  return data || [];
}

/**
 * Retrieves habit adherence data for a user over the last 30 days
 * @param userId The ID of the user to get adherence data for
 * @returns Array of habit adherence data including completion stats and consistency
 */
export async function getHabitAdherence(userId: string): Promise<HabitAdherence[]> {
  const { data, error } = await supabase
    .from('habit_adherence_view')
    .select('habit_id, name, category, icon, expected_total, actual_completions, adherence_percent, is_consistent')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching habit adherence:', error);
    throw error;
  }

  return data || [];
}

/**
 * Retrieves the top habit insights for a user, showing which habits most correlate with T-level increases
 * @param userId The ID of the user to get insights for
 * @returns Array of habit insights with their impact on T-levels
 */
export async function getTopHabitInsights(userId: string): Promise<HabitInsight[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // First, get the most recent computation date
  const { data: latestDates, error: dateError } = await supabase
    .from('habit_insights')
    .select('last_computed_at')
    .eq('user_id', userId)
    .order('last_computed_at', { ascending: false })
    .limit(1);

  if (dateError) {
    console.error('Error fetching latest computation date:', dateError);
    throw dateError;
  }

  // If no insights exist, return empty array
  if (!latestDates || latestDates.length === 0) {
    return [];
  }

  const latestDate = latestDates[0];

  // Then get the insights for that date
  const { data, error } = await supabase
    .from('habit_insights')
    .select(`
      habit_id,
      t_delta,
      description,
      rank,
      habits (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('last_computed_at', latestDate.last_computed_at)
    .gte('last_computed_at', sevenDaysAgo.toISOString())
    .order('rank', { ascending: true });

  if (error) {
    console.error('Error fetching habit insights:', error);
    throw error;
  }

  // Transform the data to flatten the habits.name into just name
  const transformedData = (data as unknown as HabitInsightWithJoin[] | null)?.map(insight => ({
    habit_id: insight.habit_id,
    name: insight.habits?.name || 'Unknown Habit',
    t_delta: insight.t_delta,
    description: insight.description,
    rank: insight.rank
  })) || [];

  return transformedData;
}

/**
 * Checks if the progress page is available for a user based on their usage duration
 * @param userId The ID of the user to check
 * @returns Object containing availability status and days remaining if not available
 */
export async function checkProgressAvailability(userId: string): Promise<ProgressAvailability> {
  const { data, error } = await supabase
    .from('t_level_estimates')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error checking progress availability:', error);
    throw error;
  }

  // If no data exists, user hasn't started using the app
  if (!data || data.length === 0) {
    return {
      isAvailable: false,
      daysRemaining: 7,
      earliestDate: null
    };
  }

  const earliestDate = new Date(data[0].created_at);
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 7 - daysSinceStart);

  return {
    isAvailable: daysRemaining === 0,
    daysRemaining,
    earliestDate: earliestDate.toISOString()
  };
} 
