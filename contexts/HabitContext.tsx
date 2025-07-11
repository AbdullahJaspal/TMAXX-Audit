import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { completeHabit, undoHabitCompletion } from '@/lib/supabase/habits';
import { useToast } from './ToastContext';
import { useAnalytics } from './AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';
import { registerContextSetters } from '@/lib/services/logoutService';

export type Habit = {
  id: string;
  name: string;
  category: 'Sleep' | 'Movement' | 'Sunlight' | 'Nutrition' | 'Recovery';
  description: string;
  whyItMatters: string;
  completed: boolean;
  reminderTime?: string;
  streak: number;
  icon?: string;
  frequency: 'Daily' | '5x Per Week' | '3x Per Week' | '1x Per Week';
  is_removable: boolean;
  user_habit_id?: string;
  completions_this_week: number;
  isCompletedToday: boolean;
  todayCompletionId: string | null;
};

type HabitContextType = {
  habits: Habit[];
  toggleHabit: (id: string) => void;
  completedCount: number;
  addHabit: (habit: Omit<Habit, 'id' | 'completed' | 'streak'> & { id?: string }) => void;
  removeHabit: (id: string) => void;
  updateHabit: (id: string, habit: Partial<Omit<Habit, 'id'>>) => void;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  toggleHabitCompletion: (habitId: string) => Promise<void>;
  clearHabits: () => void;
};

const defaultHabits: Habit[] = [
  {
    id: '1',
    name: 'Morning sunlight',
    category: 'Sunlight',
    description: 'Get 5-10 minutes of morning sunlight',
    whyItMatters: 'Morning sunlight exposure increases luteinizing hormone which directly stimulates testosterone production. It also improves sleep quality by regulating circadian rhythm.',
    completed: false,
    reminderTime: '07:30',
    streak: 3,
    icon: '🌅',
    frequency: 'Daily',
    is_removable: true,
    completions_this_week: 0,
    isCompletedToday: false,
    todayCompletionId: null,
  },
  {
    id: '3',
    name: 'Quality sleep',
    category: 'Sleep',
    description: 'Sleep 7-9 hours in a dark room',
    whyItMatters: 'Testosterone production peaks during REM sleep. Poor sleep reduces testosterone by up to 15% after just one week of insufficient sleep.',
    completed: false,
    reminderTime: '22:00',
    streak: 7,
    icon: '😴',
    frequency: 'Daily',
    is_removable: true,
    completions_this_week: 0,
    isCompletedToday: false,
    todayCompletionId: null,
  },
  {
    id: '4',
    name: 'Healthy fats',
    category: 'Nutrition',
    description: 'Include healthy fats in meals',
    whyItMatters: 'Dietary fats are essential for testosterone production. Studies show monounsaturated and saturated fats positively correlate with higher testosterone levels.',
    completed: false,
    reminderTime: '12:00',
    streak: 2,
    icon: '🥑',
    frequency: '5x Per Week',
    is_removable: true,
    completions_this_week: 0,
    isCompletedToday: false,
    todayCompletionId: null,
  },
  {
    id: '2',
    name: 'Resistance training',
    category: 'Movement',
    description: 'Complete a strength training session',
    whyItMatters: 'Compound exercises like squats and deadlifts trigger a natural testosterone boost. Research shows that lifting heavy weights increases both acute and long-term testosterone levels.',
    completed: false,
    reminderTime: '17:00',
    streak: 5,
    icon: '💪',
    frequency: '3x Per Week',
    is_removable: true,
    completions_this_week: 0,
    isCompletedToday: false,
    todayCompletionId: null,
  },
];

const HabitContext = createContext<HabitContextType>({
  habits: defaultHabits,
  toggleHabit: () => {},
  completedCount: 0,
  addHabit: () => {},
  removeHabit: () => {},
  updateHabit: () => {},
  setHabits: () => {},
  toggleHabitCompletion: async () => {},
  clearHabits: () => {},
});

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [completedCount, setCompletedCount] = useState(0);
  const { showToast } = useToast();
  const { track } = useAnalytics();

  useEffect(() => {
    const count = habits.filter(habit => habit.completed).length;
    setCompletedCount(count);
  }, [habits]);

  const toggleHabitCompletion = useCallback(async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) {
        showToast('Habit not found', 'error');
        return;
      }

      if (!habit.isCompletedToday) {
        try {
          const completionId = await completeHabit(habitId);
          setHabits(prevHabits =>
            prevHabits.map(h =>
              h.id === habitId
                ? {
                    ...h,
                    isCompletedToday: true,
                    todayCompletionId: completionId,
                    completed: true,
                    completions_this_week: h.completions_this_week + 1,
                    streak: h.streak + 1
                  }
                : h
            )
          );
          
          // Track habit completion
          track(ANALYTICS_EVENTS.HABIT_COMPLETED, {
            habit_id: habitId,
            habit_name: habit.name,
            habit_category: habit.category,
            habit_frequency: habit.frequency,
            new_streak: habit.streak + 1,
            new_completions_this_week: habit.completions_this_week + 1,
            completion_time: new Date().toISOString(),
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('network')) {
            showToast("No internet connection. Please try again when you're back online.", 'error');
          } else {
            showToast('Failed to complete habit. Please try again.', 'error');
          }
          throw error;
        }
      } else {
        try {
          if (!habit.todayCompletionId) {
            showToast('No completion record found to undo', 'error');
            return;
          }
          
          await undoHabitCompletion(habit.todayCompletionId);
          setHabits(prevHabits =>
            prevHabits.map(h =>
              h.id === habitId
                ? {
                    ...h,
                    isCompletedToday: false,
                    todayCompletionId: null,
                    completed: false,
                    completions_this_week: Math.max(0, h.completions_this_week - 1),
                    streak: Math.max(0, h.streak - 1)
                  }
                : h
            )
          );
          
          // Track habit uncompletion
          track(ANALYTICS_EVENTS.HABIT_SKIPPED, {
            habit_id: habitId,
            habit_name: habit.name,
            habit_category: habit.category,
            habit_frequency: habit.frequency,
            new_streak: Math.max(0, habit.streak - 1),
            new_completions_this_week: Math.max(0, habit.completions_this_week - 1),
            uncompletion_time: new Date().toISOString(),
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('network')) {
            showToast("No internet connection. Please try again when you're back online.", 'error');
          } else {
            showToast('Failed to undo habit completion. Please try again.', 'error');
          }
          throw error;
        }
      }
    } catch (error) {
      // Just log the error but don't show another toast
      console.error('Error toggling habit completion:', error);
      throw error;
    }
  }, [habits, showToast, track]);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'completed' | 'streak'> & { id?: string }) => {
    const newHabit: Habit = {
      ...habit,
      id: habit.id ?? Date.now().toString(),
      completed: false,
      streak: 0,
      frequency: habit.frequency ?? 'Daily',
      is_removable: habit.is_removable ?? false,
      user_habit_id: habit.user_habit_id,
      completions_this_week: habit.completions_this_week ?? 0,
      isCompletedToday: false,
      todayCompletionId: null,
    };
    setHabits(prevHabits => [...prevHabits, newHabit]);
  }, []);

  const removeHabit = useCallback((id: string) => {
    setHabits(prevHabits => prevHabits.filter(habit => habit.id !== id));
  }, []);

  const updateHabit = useCallback((id: string, habitUpdate: Partial<Omit<Habit, 'id'>>) => {
    setHabits(prevHabits =>
      prevHabits.map(habit =>
        habit.id === id ? { ...habit, ...habitUpdate } : habit
      )
    );
  }, []);

  const clearHabits = useCallback(() => {
    console.log('[HabitContext] Clearing habits data');
    setHabits([]);
    setCompletedCount(0);
  }, []);

  // Register the clearHabits function with the logout service
  React.useEffect(() => {
    registerContextSetters({ clearHabits });
  }, [clearHabits]);

  return (
    <HabitContext.Provider 
      value={{ 
        habits,
        toggleHabit: toggleHabitCompletion,
        completedCount,
        addHabit,
        removeHabit,
        updateHabit,
        setHabits,
        toggleHabitCompletion,
        clearHabits,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => useContext(HabitContext);