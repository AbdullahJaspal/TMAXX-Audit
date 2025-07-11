import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Colors from '@/constants/Colors';

type StreakCalendarProps = {
  markedDates: {
    [date: string]: {
      marked: boolean;
      dotColor?: string;
      selected?: boolean;
    };
  };
  title?: string;
};

const StreakCalendar: React.FC<StreakCalendarProps> = ({ 
  markedDates, 
  title = 'Habit Streak'
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  // Get today's date in 'YYYY-MM-DD' format
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Calendar
        style={[styles.calendar, { backgroundColor: colors.cardBackground }]}
        theme={{
          calendarBackground: colors.cardBackground,
          textSectionTitleColor: colors.text,
          textSectionTitleDisabledColor: colors.muted,
          selectedDayBackgroundColor: colors.tint,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.tint,
          dayTextColor: colors.text,
          textDisabledColor: colors.muted,
          dotColor: colors.tint,
          selectedDotColor: '#ffffff',
          arrowColor: colors.tint,
          disabledArrowColor: colors.muted,
          monthTextColor: colors.text,
          indicatorColor: colors.tint,
          textDayFontFamily: 'Inter-Regular',
          textMonthFontFamily: 'Inter-Medium',
          textDayHeaderFontFamily: 'Inter-Regular',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
        // Mark today's date
        current={today}
        markedDates={{
          ...markedDates,
          [today]: {
            ...markedDates[today],
            selected: true,
          },
        }}
        markingType={'dot'}
        hideExtraDays={false}
        enableSwipeMonths={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  calendar: {
    borderRadius: 16,
    padding: 8,
  },
});

export default StreakCalendar;