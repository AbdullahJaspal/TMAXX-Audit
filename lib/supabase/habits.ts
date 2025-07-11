import { supabase } from '../supabase/client';
import { Database } from '../supabase/types';

type Habit = Database['public']['Tables']['habits']['Row'];
type UserHabit = Database['public']['Tables']['user_habits']['Row'];
type HabitRecommendation = Database['public']['Tables']['habit_recommendations']['Row'];

export type HabitWithUserStatus = Habit & {
  is_in_plan: boolean;
  user_habit_id?: string;
  frequency?: string;
};

export type UserHabitWithDetails = Omit<Habit, 'created_by_admin' | 'is_active'> & {
  user_habit_id: string;
  frequency: string;
  last_completed_at: string | null;
  last_completion_id: string | null;
  completions_this_week: number;
  current_streak: number;
  isCompletedToday: boolean;
  todayCompletionId: string | null;
};

export type RecommendedHabit = Habit & {
  recommendation_id: string;
  criteria: string;
  reason: string;
};

type UserHabitWithHabit = {
  id: string;
  frequency: string;
  started_at: string;
  habits: Habit;
};

type HabitWithUserHabits = Habit & {
  user_habits: Array<{
    id: string;
    frequency: string;
    is_active: boolean;
  }>;
};

type HabitRecommendationWithHabit = {
  id: string;
  criteria: string;
  reason: string;
  habits: Habit;
};

/**
 * Fetches all active habits in the user's plan
 */
export async function getUserHabits(userId: string): Promise<UserHabitWithDetails[]> {
  const { data, error } = await supabase
    .from('user_habit_view')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) throw error;

  // Helper function to check if a timestamp is from today
  const isCompletedToday = (timestamp: string | null): boolean => {
    if (!timestamp) return false;
    
    try {
      const today = new Date();
      const completedDate = new Date(timestamp);
      
      // Validate the dates
      if (isNaN(completedDate.getTime()) || isNaN(today.getTime())) {
        console.warn('Invalid date encountered:', { timestamp, today });
        return false;
      }
      
      return (
        today.getFullYear() === completedDate.getFullYear() &&
        today.getMonth() === completedDate.getMonth() &&
        today.getDate() === completedDate.getDate()
      );
    } catch (error) {
      console.error('Error processing date:', error, { timestamp });
      return false;
    }
  };

  return (data as any[]).map(habit => ({
    // Habit fields
    id: habit.habit_id,
    name: habit.name,
    description: habit.description,
    category: habit.category,
    icon: habit.icon,
    why_it_matters: habit.why_it_matters,
    impact: habit.impact,
    default_freq: habit.default_freq,
    is_removable: habit.is_removable,
    created_at: habit.created_at,
    
    // UserHabitWithDetails additional fields
    user_habit_id: habit.user_habit_id,
    frequency: habit.frequency,
    last_completed_at: habit.last_completed_at,
    last_completion_id: habit.last_completion_id,
    completions_this_week: habit.completions_this_week,
    current_streak: habit.current_streak,
    isCompletedToday: isCompletedToday(habit.last_completed_at),
    todayCompletionId: isCompletedToday(habit.last_completed_at) ? habit.last_completion_id : null
  }));
}

/**
 * Returns all habits in the app with a flag indicating if they're in the user's plan
 */
export async function getHabitLibrary(userId: string): Promise<HabitWithUserStatus[]> {
  const { data, error } = await supabase
    .from('habits')
    .select(`
      *,
      user_habits!left (
        id,
        frequency,
        is_active
      )
    `)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return (data as unknown as HabitWithUserHabits[]).map(habit => {
    const userHabit = habit.user_habits?.find(uh => uh.is_active);
    return {
      ...habit,
      is_in_plan: !!userHabit,
      user_habit_id: userHabit?.id,
      frequency: userHabit?.frequency,
    };
  });
}

/**
 * Fetches recommended habits based on user's assessment triggers
 */
export async function getRecommendedHabits(
  userId: string,
  triggers: string[]
): Promise<RecommendedHabit[]> {
  // First get all habits the user already has
  const { data: userHabits, error: userHabitsError } = await supabase
    .from('user_habits')
    .select('habit_id')
    //.eq('user_id', userId) This should be handled by RLS in supabase
    .eq('is_active', true);

  if (userHabitsError) throw userHabitsError;

  const existingHabitIds = (userHabits as { habit_id: string }[]).map(uh => uh.habit_id);

  // Then get recommendations matching triggers, excluding existing habits
  const { data, error } = await supabase
    .from('habit_recommendations')
    .select(`
      id,
      criteria,
      reason,
      habits (
        id,
        name,
        description,
        category,
        icon,
        why_it_matters,
        impact,
        default_freq
      )
    `)
    //.eq('user_id', userId) This should be handled by RLS in supabase
    .eq('status', 'recommended')
    //.in('criteria', triggers)
    .not('habit_id', 'in', `(${existingHabitIds.join(',')})`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as unknown as HabitRecommendationWithHabit[]).map(rec => ({
    ...rec.habits,
    recommendation_id: rec.id,
    criteria: rec.criteria,
    reason: rec.reason,
  }));
}

/**
 * Adds a recommended habit to the user's plan
 * @param userId - The user's ID
 * @param habitId - The habit ID to add
 * @param recommendationId - The recommendation ID to update
 * @returns { success: true, user_habit_id: string } if successful, { success: false, error } if failed
 */
export async function addRecommendedHabitToPlan(
  userId: string,
  habitId: string,
  recommendationId: string
): Promise<{ success: boolean; user_habit_id?: string; error?: any }> {
  try {
    // Step 1: Update the recommendation status to 'added'
    const { error: updateError } = await supabase
      .from('habit_recommendations')
      .update({ status: 'added' })
      .eq('id', recommendationId);

    if (updateError) throw updateError;

    // Step 2: Fetch the default frequency from the habits table
    const { data: habitData, error: habitError } = await supabase
      .from('habits')
      .select('default_freq')
      .eq('id', habitId)
      .single();

    if (habitError) throw habitError;

    // Step 3: Insert a new row into user_habits
    const { data, error: insertError } = await supabase
      .from('user_habits')
      .insert({
        //user_id: userId, // This should be handled by RLS
        habit_id: habitId,
        frequency: habitData.default_freq,
        is_active: true,
        source: 'recommended',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return { success: true, user_habit_id: data.id };
  } catch (error) {
    console.error('Error adding recommended habit to plan:', error);
    return { success: false, error };
  }
}

/**
 * Updates the frequency of a habit in the user's plan
 * @param userHabitId - The ID of the user_habits row to update
 * @param newFrequency - The new frequency value to set
 * @returns { success: true } if successful, { success: false, error } if failed
 */
export async function updateUserHabitFrequency(
  userHabitId: string,
  newFrequency: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('user_habits')
      .update({ frequency: newFrequency })
      .eq('id', userHabitId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating habit frequency:', error);
    return { success: false, error };
  }
}

/**
 * Removes a habit from the user's plan by marking it as inactive
 * @param userHabitId - The ID of the user_habits row to deactivate
 * @returns { success: true } if successful, { success: false, error } if failed
 */
export async function removeUserHabit(
  userHabitId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('user_habits')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', userHabitId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing habit from plan:', error);
    return { success: false, error };
  }
}

/**
 * Test function to simulate database errors
 * @param shouldFail - Whether the operation should fail
 */
export const setTestMode = (shouldFail: boolean) => {
  (globalThis as any).__TEST_MODE__ = shouldFail;
};

/**
 * Completes a habit for today
 * @param habitId - The ID of the habit to complete
 * @returns The completion record ID if successful
 */
export async function completeHabit(habitId: string): Promise<string> {
  // Test mode for simulating errors
  if ((globalThis as any).__TEST_MODE__) {
    throw new Error('Database error: Failed to complete habit');
  }

  // Get the current user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .rpc('complete_habit', {
      p_habit_id: habitId,
      p_user_id: user.id
    });

  if (error) {
    console.error('Error completing habit:', error);
    throw error;
  }

  return data;
}

/**
 * Undoes a habit completion by deleting the completion record
 * @param completionId - The ID of the completion record to delete
 */
export async function undoHabitCompletion(completionId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('id', completionId);

  if (error) {
    console.error('Error undoing habit completion:', error);
    throw error;
  }
}

/**
 * Adds a habit from the library to the user's plan
 * @param userId - The user's ID
 * @param habitId - The habit ID to add
 * @param frequency - The frequency to set for this habit
 * @returns { success: true, user_habit_id: string } if successful, { success: false, error } if failed
 */
export async function addHabitFromLibrary(
  userId: string,
  habitId: string,
  frequency: string
): Promise<{ success: boolean; user_habit_id?: string; error?: any }> {
  try {
    // Insert a new row into user_habits
    const { data, error: insertError } = await supabase
      .from('user_habits')
      .insert({
        user_id: userId, // This should be handled by RLS
        habit_id: habitId,
        frequency: frequency,
        is_active: true,
        source: 'library',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return { success: true, user_habit_id: data.id };
  } catch (error) {
    console.error('Error adding habit from library to plan:', error);
    return { success: false, error };
  }
} 