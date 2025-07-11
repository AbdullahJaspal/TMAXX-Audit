import { supabase } from './client';

export interface TodayHabit {
  habit_id: string;
  name: string;
  description: string;
  frequency: string;
  completions_this_week: number;
  current_streak: number;
  user_habit_id: string;
}

export async function getTodayHabits(): Promise<TodayHabit[]> {
  const { data, error } = await supabase
    .from('today_habit_view')
    .select('habit_id, name, description, frequency, completions_this_week, current_streak, user_habit_id');

  if (error) {
    console.error('Error fetching today habits:', error);
    throw error;
  }

  return data || [];
}

export async function getTodayHabitsByUserId(userId: string): Promise<TodayHabit[]> {
  const { data, error } = await supabase
    .from('today_habit_view')
    .select('habit_id, name, description, frequency, completions_this_week, current_streak, user_habit_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching today habits for user:', error);
    throw error;
  }

  return data || [];
}

export async function toggleHabitCompletion(
  habitId: string,
  userId: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: any }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    if (isCompleted) {
      // Add completion record
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          completed_on: today,
          user_id: userId
        });
      
      if (error) throw error;
    } else {
      // Remove completion record
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('completed_on', today);
      
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    return { success: false, error };
  }
} 