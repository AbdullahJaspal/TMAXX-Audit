import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowRight, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';

interface Props {
  onContinue: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DateInput({ onContinue }: Props) {
  const { dob, setDob } = useOnboarding();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dob ? new Date(dob) : new Date());
  const [showError, setShowError] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD for the API
      const formattedDate = date.toISOString().split('T')[0];
      setDob(formattedDate);
      // Clear error when user selects a new date
      setShowError(false);
    }
  };

  const handleContinue = () => {
    if (selectedDate && isValidAge()) {
      // Format date as YYYY-MM-DD for the API
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDob(formattedDate);
      onContinue();
    } else {
      setShowError(true);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const isValidAge = () => {
    const age = calculateAge(selectedDate);
    return age >= 13 && age <= 80;
  };

  const getAgeValidationMessage = () => {
    const age = calculateAge(selectedDate);
    if (age < 13) {
      return "You must be at least 13 years old to use this app.";
    } else if (age > 80) {
      return "This app isn't configured to properly work for users over 80 years old.";
    }
    return "";
  };

  const changeMonth = (increment: boolean) => {
    const newDate = new Date(selectedDate);
    if (increment) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
    setShowError(false);
  };

  const changeYear = (increment: boolean) => {
    const newDate = new Date(selectedDate);
    if (increment) {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setSelectedDate(newDate);
    setShowError(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const WebCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const selectedDay = selectedDate.getDate();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Remove date restrictions - allow any date selection
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const selectDay = (day: number) => {
      if (day) {
        setSelectedDate(new Date(year, month, day));
        setShowError(false);
      }
    };

    return (
      <View style={[styles.webCalendar, { backgroundColor: colors.onboardingBackground }]}>
        <View style={styles.calendarHeader}>
          <View style={styles.monthYearSelector}>
            <TouchableOpacity 
              onPress={() => changeMonth(false)}
              style={[styles.arrowButton, { backgroundColor: colors.onboardingCardBackground }]}>
              <ChevronLeft size={24} color={colors.muted} />
            </TouchableOpacity>
            <Text style={[styles.monthYearText, { color: colors.text }]}>{MONTHS[month]}</Text>
            <TouchableOpacity 
              onPress={() => changeMonth(true)}
              style={[styles.arrowButton, { backgroundColor: colors.onboardingCardBackground }]}>
              <ChevronRight size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.monthYearSelector}>
            <TouchableOpacity 
              onPress={() => changeYear(false)}
              style={[styles.arrowButton, { backgroundColor: colors.onboardingCardBackground }]}>
              <ChevronLeft size={24} color={colors.muted} />
            </TouchableOpacity>
            <Text style={[styles.monthYearText, { color: colors.text }]}>{year}</Text>
            <TouchableOpacity 
              onPress={() => changeYear(true)}
              style={[styles.arrowButton, { backgroundColor: colors.onboardingCardBackground }]}>
              <ChevronRight size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.daysHeader}>
          {DAYS.map(day => (
            <Text key={day} style={[styles.dayHeaderText, { color: colors.muted }]}>{day}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((day, index) => (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                day === selectedDay && { backgroundColor: colors.ctaBg, borderRadius: 999 },
              ]}
              onPress={() => day && selectDay(day)}>
              <Text style={[
                styles.dayText,
                { color: colors.text },
                day === selectedDay && { color: colors.ctaText, fontFamily: 'Inter-Medium' },
              ]}>
                {day || ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.selectedDateText, { color: colors.muted }]}>
          Selected: {formatDate(selectedDate)}
        </Text>
      </View>
    );
  };

  // For web platform, always use the custom calendar
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
        <WebCalendar />
        
        {showError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {getAgeValidationMessage()}
          </Text>
        )}
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={handleContinue}>
          <Text style={[styles.buttonText, { color: colors.ctaText }]}>
            Continue
          </Text>
          <ArrowRight size={20} color={colors.ctaText} />
        </TouchableOpacity>
      </View>
    );
  }

  // For native platforms, use the native date picker
  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <View style={styles.dateContainer}>
        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.onboardingCardBackground }]}
            onPress={() => setShowPicker(true)}>
            <Text style={[styles.dateButtonText, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        )}

        {(showPicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            style={styles.datePicker}
            textColor={Platform.OS === 'ios' ? colors.text : undefined}
          />
        )}
      </View>

      {showError && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {getAgeValidationMessage()}
        </Text>
      )}

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary }]} 
        onPress={handleContinue}>
        <Text style={[styles.buttonText, { color: colors.ctaText }]}>
          Continue
        </Text>
        <ArrowRight size={20} color={colors.ctaText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  dateContainer: {
    marginBottom: 32,
  },
  dateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
  },
  datePicker: {
    height: 200,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  webCalendar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    }),
  },
  calendarHeader: {
    marginBottom: 20,
    gap: 8,
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  monthYearText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
    width: 120,
    textAlign: 'center',
  },
  arrowButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748b',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedDay: {
    backgroundColor: '#00A3FF',
    borderRadius: 999,
  },
  selectedDayText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
  },
  disabledDay: {
    opacity: 0.4,
  },
  disabledDayText: {
    color: '#94a3b8',
  },
  selectedDateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00A3FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#fff',
  },
  buttonTextDisabled: {
    color: '#94A3B8',
  },
});