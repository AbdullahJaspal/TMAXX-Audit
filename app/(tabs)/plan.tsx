import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, Platform, StatusBar } from 'react-native';
import Colors from '@/constants/Colors';
import { useHabits, Habit } from '@/contexts/HabitContext';
import { Clock, Plus, Pencil, Info, X, Trash2 } from 'lucide-react-native';
import HabitLibraryModal from '@/components/plan/HabitLibraryModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useScreenTracking } from '@/components/analytics/withScreenTracking';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSentry } from '@/contexts/SentryContext';
import { useSentryErrorBoundary } from '@/hooks/useSentryErrorBoundary';
import { useToast } from '@/contexts/ToastContext';
import { logInfo, logError, trackUserAction } from '@/lib/sentry';
import { SCREEN_NAMES, ANALYTICS_EVENTS } from '@/lib/analytics';
import { getUserHabits, getRecommendedHabits, UserHabitWithDetails, RecommendedHabit, updateUserHabitFrequency, removeUserHabit, addHabitFromLibrary } from '@/lib/supabase/habits';
import { useAuth } from '@/contexts/AuthContext';
import { addRecommendedHabitToPlan } from '@/lib/supabase/habits';

export default function PlanScreen() {
  const { habits, updateHabit, removeHabit, addHabit, setHabits } = useHabits();
  const { theme } = useTheme();
  const { session } = useAuth();
  const { track } = useAnalytics();
  const { captureError, addBreadcrumb } = useSentry();
  const { showToast } = useToast();
  const colors = Colors[theme];
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [suggestedHabits, setSuggestedHabits] = useState<RecommendedHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track screen view
  useScreenTracking(SCREEN_NAMES.PLAN);

  useEffect(() => {
    async function loadHabits() {
      if (!session?.user.id) return;
            
      try {
        setIsLoading(true);
        
        // Add breadcrumb for data loading
        addBreadcrumb({
          message: 'Loading user habits',
          category: 'data_loading',
          level: 'info',
          data: { user_id: session.user.id },
        });
        
        // Fetch user's current habits
        const userHabits = await getUserHabits(session.user.id);
        
        // Clear existing habits before adding new ones
        setHabits([]);
        
        // Update the habits context with the fetched habits
        userHabits.forEach(habit => {
          if (!habit.name) return; // Skip habits without names
          
          const habitData: Omit<Habit, 'id' | 'completed' | 'streak'> & { id?: string } = {
            id: habit.id, // Pass the database habit id
            name: habit.name,
            description: habit.description ?? 'No description provided',
            category: (habit.category ?? 'Movement') as 'Sleep' | 'Movement' | 'Sunlight' | 'Nutrition' | 'Recovery',
            whyItMatters: habit.why_it_matters ?? 'This habit can help improve your overall health and well-being.',
            icon: habit.icon ?? '',
            reminderTime: '09:00', // Default reminder time
            is_removable: habit.is_removable ?? false, // Ensure this is populated from the database
            user_habit_id: habit.user_habit_id,
            frequency: (habit.frequency ?? 'Daily') as 'Daily' | '5x Per Week' | '3x Per Week' | '1x Per Week',
            completions_this_week: habit.completions_this_week,
            isCompletedToday: habit.isCompletedToday,
            todayCompletionId: habit.todayCompletionId,
          };
          addHabit(habitData);
        });
        
        // Fetch recommended habits
        const recommended = await getRecommendedHabits(session.user.id, ['low_sleep', 'low_energy']);
        setSuggestedHabits(recommended);
        
        // Add success breadcrumb
        addBreadcrumb({
          message: 'User habits loaded successfully',
          category: 'data_loading',
          level: 'info',
          data: { 
            habits_count: userHabits.length,
            recommended_count: recommended.length,
          },
        });
      } catch (error) {
        // Capture data loading error
        captureError(error as Error, {
          tags: {
            operation: 'load_habits',
            error_type: 'data_loading',
          },
          extra: {
            user_id: session.user.id,
            error_stack: (error as Error).stack,
          },
        });
        
        logError('Failed to load user habits', error as Error, {
          user_id: session.user.id,
          context: 'plan_screen_habit_loading'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadHabits();
  }, [session?.user.id, addHabit]);

  useEffect(() => {
    if (selectedHabit) {
    }
  }, [selectedHabit]);

  const frequencyOptions = ['Daily', '5x Per Week', '3x Per Week', '1x Per Week'] as const;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sleep':
        return '#9333ea';
      case 'Movement':
        return '#f97316';
      case 'Sunlight':
        return '#eab308';
      case 'Nutrition':
        return '#22c55e';
      case 'Recovery':
        return '#0ea5e9';
      default:
        return colors.tint;
    }
  };

  const getCategoryShade = (category: string) => {
    return getCategoryColor(category) + '20';
  };

  const handleUpdateFrequency = async (frequency: typeof frequencyOptions[number]) => {
    if (selectedHabit && selectedHabit.user_habit_id) {
      // Add breadcrumb for user action
      addBreadcrumb({
        message: 'User updated habit frequency',
        category: 'user_action',
        level: 'info',
        data: {
          habit_id: selectedHabit.id,
          habit_name: selectedHabit.name,
          old_frequency: selectedHabit.frequency,
          new_frequency: frequency,
        },
      });
      
      try {
        const result = await updateUserHabitFrequency(selectedHabit.user_habit_id, frequency);
        if (result.success) {
          // Add success breadcrumb
          addBreadcrumb({
            message: 'Habit frequency updated successfully',
            category: 'user_action',
            level: 'info',
            data: { habit_id: selectedHabit.id, new_frequency: frequency },
          });
          
          updateHabit(selectedHabit.id, { frequency });
          setSelectedHabit(null);
        } else {
          // Capture API error
          const error = new Error(`Failed to update habit frequency: ${result.error}`);
          captureError(error, {
            tags: {
              operation: 'update_habit_frequency',
              habit_id: selectedHabit.id,
              habit_category: selectedHabit.category,
            },
            extra: {
              user_habit_id: selectedHabit.user_habit_id,
              old_frequency: selectedHabit.frequency,
              new_frequency: frequency,
              api_error: result.error,
            },
          });
          
          logError('Failed to update habit frequency', new Error(result.error), {
            habit_id: selectedHabit.id,
            habit_category: selectedHabit.category,
            old_frequency: selectedHabit.frequency,
            new_frequency: frequency,
            api_error: result.error,
          });
          
          showToast('Failed to update habit frequency. Please try again.', 'error');
        }
      } catch (error) {
        // Capture unexpected error
        captureError(error as Error, {
          tags: {
            operation: 'update_habit_frequency',
            habit_id: selectedHabit.id,
            habit_category: selectedHabit.category,
            error_type: 'unexpected',
          },
          extra: {
            user_habit_id: selectedHabit.user_habit_id,
            old_frequency: selectedHabit.frequency,
            new_frequency: frequency,
            error_stack: (error as Error).stack,
          },
        });
        
        logError('Error updating habit frequency', error as Error, {
          habit_id: selectedHabit.id,
          habit_category: selectedHabit.category,
          old_frequency: selectedHabit.frequency,
          new_frequency: frequency,
        });
        showToast('Failed to update habit frequency. Please try again.', 'error');
      }
    }
  };

  const handleRemoveHabit = async () => {
    if (!selectedHabit) {
      showToast('No habit selected for removal.', 'error');
      return;
    }

    if (!selectedHabit.user_habit_id) {
      // This should not happen if we're properly checking above, but just in case
      showToast('This habit cannot be removed. Please try refreshing the app.', 'error');
      return;
    }
    
    // Add breadcrumb for user action
    addBreadcrumb({
      message: 'User initiated habit removal',
      category: 'user_action',
      level: 'info',
      data: {
        habit_id: selectedHabit.id,
        habit_name: selectedHabit.name,
        habit_category: selectedHabit.category,
        user_habit_id: selectedHabit.user_habit_id,
      },
    });
    
    try {
      const result = await removeUserHabit(selectedHabit.user_habit_id);
      
      if (result.success) {
        // Track habit deletion
        track(ANALYTICS_EVENTS.HABIT_DELETED, {
          habit_id: selectedHabit.id,
          habit_name: selectedHabit.name,
          habit_category: selectedHabit.category,
          habit_frequency: selectedHabit.frequency,
          final_streak: selectedHabit.streak,
          removal_time: new Date().toISOString(),
          removal_source: 'plan_screen',
        });
        
        // Add success breadcrumb
        addBreadcrumb({
          message: 'Habit removal completed successfully',
          category: 'user_action',
          level: 'info',
          data: { habit_id: selectedHabit.id },
        });
        
        removeHabit(selectedHabit.id);
        setSelectedHabit(null);
      } else {
        // Capture API error
        const error = new Error(`Failed to remove habit: ${result.error}`);
        captureError(error, {
          tags: {
            operation: 'remove_habit',
            habit_id: selectedHabit.id,
            habit_category: selectedHabit.category,
          },
          extra: {
            user_habit_id: selectedHabit.user_habit_id,
            api_error: result.error,
            habit_name: selectedHabit.name,
          },
        });
        
        logError('Failed to remove habit', error, { 
          habit_id: selectedHabit.id,
          api_error: result.error 
        });
        showToast('Failed to remove habit. Please try again.', 'error');
      }
    } catch (error) {
      // Capture unexpected error
      captureError(error as Error, {
        tags: {
          operation: 'remove_habit',
          habit_id: selectedHabit.id,
          habit_category: selectedHabit.category,
          error_type: 'unexpected',
        },
        extra: {
          user_habit_id: selectedHabit.user_habit_id,
          habit_name: selectedHabit.name,
          error_stack: (error as Error).stack,
        },
      });
      
      logError('Error removing habit', error as Error, { 
        habit_id: selectedHabit.id,
        user_habit_id: selectedHabit.user_habit_id 
      });
      showToast('Failed to remove habit. Please try again.', 'error');
    }
  };

  const handleAddSuggestedHabit = async (habit: RecommendedHabit, index: number) => {
    if (!habit.name) return; // Ensure we have at least a name
    if (!session?.user.id) return; // Ensure user ID is available
    
    // Add breadcrumb for user action
    addBreadcrumb({
      message: 'User added suggested habit',
      category: 'user_action',
      level: 'info',
      data: {
        habit_id: habit.id,
        habit_name: habit.name,
        habit_category: habit.category,
        recommendation_id: habit.recommendation_id,
      },
    });
    
    try {
      const result = await addRecommendedHabitToPlan(session.user.id, habit.id, habit.recommendation_id);
      if (result.success && result.user_habit_id) {
        // Track habit creation
        track(ANALYTICS_EVENTS.HABIT_CREATED, {
          habit_id: habit.id,
          habit_name: habit.name,
          habit_category: habit.category ?? 'Movement',
          habit_frequency: 'Daily',
          is_removable: habit.is_removable ?? false,
          creation_time: new Date().toISOString(),
          creation_source: 'suggested_habit',
        });
        
        // Add success breadcrumb
        addBreadcrumb({
          message: 'Suggested habit added successfully',
          category: 'user_action',
          level: 'info',
          data: { habit_id: habit.id, habit_name: habit.name, user_habit_id: result.user_habit_id },
        });
        
        const habitData: Omit<Habit, 'id' | 'completed' | 'streak'> & { id?: string; is_removable?: boolean } = {
          id: habit.id, // Pass the database habit id
          name: habit.name,
          description: habit.description ?? 'No description provided',
          category: (habit.category ?? 'Movement') as 'Sleep' | 'Movement' | 'Sunlight' | 'Nutrition' | 'Recovery',
          whyItMatters: habit.why_it_matters ?? 'This habit can help improve your overall health and well-being.',
          icon: habit.icon ?? '',
          reminderTime: '09:00', // Default reminder time
          is_removable: habit.is_removable ?? false, // Default to false if null
          frequency: 'Daily' as const, // Default frequency for new habits
          user_habit_id: result.user_habit_id, // Use the returned user_habit_id
          completions_this_week: 0, // Default for new habits
          isCompletedToday: false, // Default for new habits
          todayCompletionId: null, // Default for new habits
        };
        addHabit(habitData);
        setSuggestedHabits(current => current.filter((_, i) => i !== index));
      } else {
        // Capture API error
        const error = new Error(`Failed to add recommended habit: ${result.error}`);
        captureError(error, {
          tags: {
            operation: 'add_suggested_habit',
            habit_id: habit.id,
            habit_category: habit.category,
          },
          extra: {
            user_id: session.user.id,
            recommendation_id: habit.recommendation_id,
            api_error: result.error,
            habit_name: habit.name,
          },
        });
        
        logError('Failed to add recommended habit', new Error(result.error), {
          habit_id: habit.id,
          habit_category: habit.category,
          api_error: result.error,
        });
        showToast('Failed to add habit. Please try again.', 'error');
      }
    } catch (error) {
      // Capture unexpected error
      captureError(error as Error, {
        tags: {
          operation: 'add_suggested_habit',
          habit_id: habit.id,
          habit_category: habit.category,
          error_type: 'unexpected',
        },
        extra: {
          user_id: session.user.id,
          recommendation_id: habit.recommendation_id,
          habit_name: habit.name,
          error_stack: (error as Error).stack,
        },
      });
      
      logError('Error adding recommended habit', error as Error, {
        habit_id: habit.id,
        habit_category: habit.category,
      });
      showToast('Failed to add habit. Please try again.', 'error');
    }
  };

  const handleAddFromLibrary = async (habit: any) => {
    if (!session?.user.id) {
      showToast('Please log in to add habits.', 'error');
      return;
    }

    // Add breadcrumb for user action
    addBreadcrumb({
      message: 'User added habit from library',
      category: 'user_action',
      level: 'info',
      data: {
        habit_id: habit.id,
        habit_name: habit.name,
        habit_category: habit.category,
        frequency: habit.frequency,
      },
    });

    try {
      const result = await addHabitFromLibrary(session.user.id, habit.id, habit.frequency);
      
      if (result.success && result.user_habit_id) {
        // Track habit creation from library
        track(ANALYTICS_EVENTS.HABIT_CREATED, {
          habit_id: habit.id,
          habit_name: habit.name,
          habit_category: habit.category,
          habit_frequency: habit.frequency ?? 'Daily',
          is_removable: habit.is_removable ?? false,
          creation_time: new Date().toISOString(),
          creation_source: 'habit_library',
        });
        
        // Add success breadcrumb
        addBreadcrumb({
          message: 'Habit from library added successfully',
          category: 'user_action',
          level: 'info',
          data: { habit_id: habit.id, habit_name: habit.name, user_habit_id: result.user_habit_id },
        });
        
        // Create the habit object with the user_habit_id
        const habitData: Omit<Habit, 'id' | 'completed' | 'streak'> & { id?: string } = {
          id: habit.id,
          name: habit.name,
          description: habit.description ?? 'No description provided',
          category: (habit.category ?? 'Movement') as 'Sleep' | 'Movement' | 'Sunlight' | 'Nutrition' | 'Recovery',
          whyItMatters: habit.why_it_matters ?? 'This habit can help improve your overall health and well-being.',
          icon: habit.icon ?? '',
          reminderTime: '09:00',
          is_removable: habit.is_removable ?? false,
          user_habit_id: result.user_habit_id, // Use the returned user_habit_id
          frequency: (habit.frequency ?? 'Daily') as 'Daily' | '5x Per Week' | '3x Per Week' | '1x Per Week',
          completions_this_week: 0,
          isCompletedToday: false,
          todayCompletionId: null,
        };
        
        addHabit(habitData);
        setShowLibrary(false);
      } else {
        // Capture API error
        const error = new Error(`Failed to add habit from library: ${result.error}`);
        captureError(error, {
          tags: {
            operation: 'add_habit_from_library',
            habit_id: habit.id,
            habit_category: habit.category,
          },
          extra: {
            user_id: session.user.id,
            frequency: habit.frequency,
            api_error: result.error,
            habit_name: habit.name,
          },
        });
        
        logError('Failed to add habit from library', error, {
          habit_id: habit.id,
          habit_category: habit.category,
          api_error: result.error,
        });
        showToast('Failed to add habit. Please try again.', 'error');
      }
    } catch (error) {
      // Capture unexpected error
      captureError(error as Error, {
        tags: {
          operation: 'add_habit_from_library',
          habit_id: habit.id,
          habit_category: habit.category,
          error_type: 'unexpected',
        },
        extra: {
          user_id: session.user.id,
          frequency: habit.frequency,
          habit_name: habit.name,
          error_stack: (error as Error).stack,
        },
      });
      
      logError('Error adding habit from library', error as Error, {
        habit_id: habit.id,
        habit_category: habit.category,
      });
      showToast('Failed to add habit. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Your T-Maxx Plan
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Habits selected based on your goals. Edit, add, or swap anytime.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Habits
          </Text>

          <View style={styles.habitsSection}>
            {habits.map((habit) => (
              <View 
                key={habit.id}
                style={[
                  styles.habitCard,
                  { backgroundColor: colors.cardBackground }
                ]}
              >
                <View style={styles.habitContent}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <View style={styles.habitMain}>
                    <Text style={[styles.habitTitle, { color: colors.text }]}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.habitDescription, { color: colors.muted }]}>
                      {habit.description}
                    </Text>
                    <View style={styles.habitMeta}>
                      <View 
                        style={[
                          styles.categoryTag, 
                          { backgroundColor: getCategoryShade(habit.category ?? 'Movement') }
                        ]}
                      >
                        <Text style={[styles.categoryText, { color: getCategoryColor(habit.category ?? 'Movement') }]}>
                          {habit.category ?? 'Movement'}
                        </Text>
                      </View>
                      <View style={[styles.frequencyTag, { backgroundColor: colors.tint + '20' }]}>
                        <Clock size={14} color={colors.tint} />
                        <Text style={[styles.frequencyText, { color: colors.tint }]}>
                          {habit.frequency}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      setSelectedHabit(habit);
                    }}
                  >
                    <Pencil size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowLibrary(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Habit</Text>
          </TouchableOpacity>

          {suggestedHabits.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Suggested Habits
              </Text>

              <View style={styles.suggestedSection}>
                {suggestedHabits.map((habit, index) => (
                  <View 
                    key={habit.id}
                    style={[
                      styles.habitCard,
                      { backgroundColor: colors.cardBackground }
                    ]}
                  >
                    <View style={styles.habitContent}>
                      <Text style={styles.habitIcon}>{habit.icon}</Text>
                      <View style={styles.habitMain}>
                        <Text style={[styles.habitTitle, { color: colors.text }]}>
                          {habit.name}
                        </Text>
                        <Text style={[styles.habitDescription, { color: colors.muted }]}>
                          {habit.description}
                        </Text>
                        <View style={styles.habitMeta}>
                          <View 
                            style={[
                              styles.categoryTag, 
                              { backgroundColor: getCategoryShade(habit.category ?? 'Movement') }
                            ]}
                          >
                            <Text style={[styles.categoryText, { color: getCategoryColor(habit.category ?? 'Movement') }]}>
                              {habit.category ?? 'Movement'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.addSmallButton, { backgroundColor: colors.tint }]}
                        onPress={() => handleAddSuggestedHabit(habit, index)}
                      >
                        <Plus size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={[styles.whySection, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.whyHeader}>
              <View style={styles.whyTitleContainer}>
                <Info size={20} color={colors.text} />
                <Text style={[styles.whyTitle, { color: colors.text }]}>
                  Why These Habits?
                </Text>
              </View>
            </View>

            <View style={styles.whyContent}>
              <Text style={[styles.whyText, { color: colors.muted }]}>
                Based on your quiz, we prioritized improving energy, recovery, and insulin control. These habits work together to naturally optimize your testosterone levels.
              </Text>
              {/* Temporarily disabled until ready
              <TouchableOpacity>
                <Text style={[styles.retakeButton, { color: colors.tint }]}>
                  Retake Quiz
                </Text>
              </TouchableOpacity>
              */}
            </View>
          </View>

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <Modal
        visible={selectedHabit !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHabit(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Habit
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedHabit(null)}
                style={[styles.closeButton, { backgroundColor: colors.background }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedHabit && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalHabitName, { color: colors.text }]}>
                  {selectedHabit.name}
                </Text>
                
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    Frequency
                  </Text>
                  <View style={styles.frequencyOptions}>
                    {frequencyOptions.map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.frequencyOption,
                          { 
                            backgroundColor: selectedHabit.frequency === freq ? colors.tint : colors.background,
                            borderColor: colors.border,
                          }
                        ]}
                        onPress={() => handleUpdateFrequency(freq)}
                      >
                        <Text style={[
                          styles.frequencyOptionText,
                          { color: selectedHabit.frequency === freq ? '#fff' : colors.text }
                        ]}>
                          {freq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {selectedHabit.is_removable && (
                  <TouchableOpacity 
                    style={[styles.removeButton, { borderColor: colors.error }]}
                    onPress={handleRemoveHabit}
                  >
                    <Trash2 size={20} color={colors.error} />
                    <Text style={[styles.removeText, { color: colors.error }]}>
                      Remove Habit
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <HabitLibraryModal
        visible={showLibrary}
        onClose={() => setShowLibrary(false)}
        onAddHabit={handleAddFromLibrary}
        currentHabitCount={habits.length}
        currentHabits={habits}
      />
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  habitsSection: {
    marginBottom: 24,
  },
  suggestedSection: {
    marginBottom: 24,
  },
  habitCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  habitMain: {
    flex: 1,
    paddingRight: 12,
  },
  habitTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  frequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  editButton: {
    padding: 4,
  },
  addSmallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  whySection: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  whyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  whyContent: {
    padding: 16,
    paddingTop: 0,
  },
  whyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  retakeButton: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 24,
  },
  modalHabitName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  modalSection: {
    gap: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  frequencyOptions: {
    gap: 8,
  },
  frequencyOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  frequencyOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  removeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});