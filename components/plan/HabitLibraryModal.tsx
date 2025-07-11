import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';
import { X, Zap, Plus, ChevronRight, Check } from 'lucide-react-native';
import { Habit } from '@/contexts/HabitContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getHabitLibrary, HabitWithUserStatus } from '@/lib/supabase/habits';
import { useAuth } from '@/contexts/AuthContext';

type HabitLibraryModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddHabit: (habit: any) => void;
  currentHabitCount: number;
  currentHabits: Habit[];
};

const categories = [
  { id: 'all', name: '🎯 All', icon: '🎯' },
] as const;

const frequencyOptions = ['Daily', '5x Per Week', '3x Per Week', '1x Per Week'] as const;

export default function HabitLibraryModal({ 
  visible, 
  onClose, 
  onAddHabit, 
  currentHabitCount,
  currentHabits 
}: HabitLibraryModalProps) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const colors = Colors[theme];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHabit, setSelectedHabit] = useState<HabitWithUserStatus | null>(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [habits, setHabits] = useState<HabitWithUserStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function loadHabits() {
      if (!session?.user.id) return;
      
      try {
        setIsLoading(true);
        const habitLibrary = await getHabitLibrary(session.user.id);
        setHabits(habitLibrary);
        
        // Extract unique categories from habits
        const uniqueCategories = Array.from(new Set(habitLibrary.map(habit => habit.category)))
          .filter((category): category is string => category !== null)
          .map(category => ({
            id: category,
            name: category
          }));
        
        setAvailableCategories(uniqueCategories);
      } catch (error) {
        console.error('Error loading habit library:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (visible) {
      loadHabits();
    }
  }, [session?.user.id, visible]);

  const filteredHabits = selectedCategory === 'all' 
    ? habits 
    : habits.filter(habit => habit.category === selectedCategory);

  const handleAddHabit = (habit: HabitWithUserStatus) => {
    if (currentHabitCount >= 6) {
      setSelectedHabit(habit);
      return;
    }
    setSelectedHabit(habit);
    setShowFrequencyModal(true);
  };

  const handleSelectFrequency = (frequency: typeof frequencyOptions[number]) => {
    if (selectedHabit) {
      onAddHabit({ ...selectedHabit, frequency });
      setShowFrequencyModal(false);
      setSelectedHabit(null);
    }
  };

  const renderImpact = (impact: number) => {
    return Array(impact).fill(0).map((_, i) => (
      <Zap key={i} size={16} color={colors.tint} style={{ marginLeft: i > 0 ? -6 : 0 }} />
    ));
  };

  const isHabitInPlan = (habit: HabitWithUserStatus) => {
    return currentHabits.some(h => h.name === habit.name);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.cardBackground }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Choose a Habit to Add</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Backed by science. Built for testosterone.</Text>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                { 
                  backgroundColor: selectedCategory === category.id ? colors.tint : 'transparent',
                  borderColor: selectedCategory === category.id ? colors.tint : colors.border,
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category.id ? '#fff' : colors.text }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
          {availableCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                { 
                  backgroundColor: selectedCategory === category.id ? colors.tint : 'transparent',
                  borderColor: selectedCategory === category.id ? colors.tint : colors.border,
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category.id ? '#fff' : colors.text }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.habitsContainer}>
          {filteredHabits.map(habit => {
            const isAdded = isHabitInPlan(habit);
            
            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard, 
                  { 
                    backgroundColor: colors.cardBackground,
                    opacity: isAdded ? 0.7 : 1 
                  }
                ]}
                onPress={() => !isAdded && setSelectedHabit(habit)}
                disabled={isAdded}
              >
                <View style={styles.habitHeader}>
                  <View style={styles.habitTitleRow}>
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <View style={styles.habitTitleContainer}>
                      <Text style={[styles.habitTitle, { color: colors.text }]}>{habit.name}</Text>
                      <Text style={[styles.habitDescription, { color: colors.muted }]}>
                        {habit.description}
                      </Text>
                    </View>
                  </View>
                  {isAdded ? (
                    <View style={[styles.addedBadge, { backgroundColor: colors.success + '20' }]}>
                      <Check size={16} color={colors.success} />
                      <Text style={[styles.addedText, { color: colors.success }]}>Added</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: colors.tint }]}
                      onPress={() => handleAddHabit(habit)}
                    >
                      <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.habitMeta}>
                  <View style={[styles.effortBadge, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.effortText, { color: colors.text }]}>{habit.effort} Effort</Text>
                  </View>
                  <View style={styles.impactContainer}>
                    <Text style={[styles.impactLabel, { color: colors.muted }]}>T-Impact:</Text>
                    <View style={styles.impactIcons}>
                      {renderImpact(habit.impact)}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Habit Detail Modal */}
        <Modal
          visible={selectedHabit !== null && !showFrequencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedHabit(null)}
        >
          <View style={styles.detailOverlay}>
            <View style={[styles.detailModal, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity
                style={[styles.closeDetailButton, { backgroundColor: colors.background }]}
                onPress={() => setSelectedHabit(null)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>

              {selectedHabit && (
                <View style={styles.detailContent}>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>
                    {selectedHabit.name}
                  </Text>
                  
                  <Text style={[styles.detailDescription, { color: colors.muted }]}>
                    {selectedHabit.description}
                  </Text>

                  <View style={[styles.whySection, { backgroundColor: colors.background }]}>
                    <Text style={[styles.whyTitle, { color: colors.text }]}>Why This Works</Text>
                    <Text style={[styles.whyText, { color: colors.muted }]}>
                      {selectedHabit.why_it_matters}
                    </Text>
                  </View>

                  {currentHabitCount >= 6 ? (
                    <View style={styles.warningSection}>
                      <Text style={[styles.warningText, { color: colors.error }]}>
                        Most guys stick with 3-5 active habits for better consistency. Want to replace one instead?
                      </Text>
                      <TouchableOpacity
                        style={[styles.replaceButton, { backgroundColor: colors.tint }]}
                        onPress={() => {
                          setSelectedHabit(null);
                          onClose();
                        }}
                      >
                        <Text style={styles.replaceButtonText}>Manage Current Habits</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addToPlanButton, { backgroundColor: colors.tint }]}
                      onPress={() => {
                        setShowFrequencyModal(true);
                      }}
                    >
                      <Text style={styles.addToPlanText}>Add to Plan</Text>
                      <ChevronRight size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Frequency Selection Modal */}
        <Modal
          visible={showFrequencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowFrequencyModal(false);
            setSelectedHabit(null);
          }}
        >
          <View style={styles.detailOverlay}>
            <View style={[styles.detailModal, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity
                style={[styles.closeDetailButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowFrequencyModal(false);
                  setSelectedHabit(null);
                }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.detailContent}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>
                  Set Frequency
                </Text>

                <Text style={[styles.detailDescription, { color: colors.muted }]}>
                  How often would you like to perform this habit?
                </Text>

                <View style={styles.frequencyOptions}>
                  {frequencyOptions.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyOption,
                        { 
                          backgroundColor: selectedHabit?.recommendedFrequency === freq ? colors.tint + '20' : colors.background,
                          borderColor: colors.border,
                        }
                      ]}
                      onPress={() => handleSelectFrequency(freq)}
                    >
                      <Text style={[styles.frequencyOptionText, { color: colors.text }]}>
                        {freq}
                      </Text>
                      {selectedHabit?.recommendedFrequency === freq && (
                        <Text style={[styles.recommendedText, { color: colors.tint }]}>
                          Recommended
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextContainer: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  categoriesContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    minHeight: 36,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  habitsContainer: {
    padding: 20,
  },
  habitCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitTitleRow: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  habitTitleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  effortBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  effortText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginRight: 8,
  },
  impactIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModal: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  closeDetailButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    gap: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  detailDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  whySection: {
    padding: 16,
    borderRadius: 16,
  },
  whyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  whyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  warningSection: {
    gap: 16,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  replaceButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  replaceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  addToPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addToPlanText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 4,
  },
  frequencyOptions: {
    gap: 8,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  recommendedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});