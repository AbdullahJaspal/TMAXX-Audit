import React, { createContext, useContext, ReactNode, useState } from 'react';
import { registerContextSetters } from '@/lib/services/logoutService';

type DailyProgress = {
  date: string;
  tLevel: number;
  completedHabits: string[];
};

type HeatmapData = {
  [date: string]: { marked: boolean; dotColor?: string; selected?: boolean };
};

// Generate realistic T-level progression from 450 to 550
const generateProgressiveData = (startLevel: number, endLevel: number, days: number) => {
  const increment = (endLevel - startLevel) / days;
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    level: Math.round(startLevel + (increment * i) + (Math.random() * 3 - 1.5)) // Smaller random variation
  }));
};

// Data for the weekly chart (showing clear upward trend)
const weeklyData = [
  { day: 'Mon', level: 450 },
  { day: 'Tue', level: 465 },
  { day: 'Wed', level: 482 },
  { day: 'Thu', level: 498 },
  { day: 'Fri', level: 515 },
  { day: 'Sat', level: 532 },
  { day: 'Sun', level: 550 },
];

// Data for the monthly chart (last 30 days)
const monthlyData = generateProgressiveData(450, 550, 30);

// Historical data (last 90 days)
const generateProgressHistory = (): DailyProgress[] => {
  const today = new Date();
  const history: DailyProgress[] = [];
  const startLevel = 450;
  const endLevel = 550;
  const totalDays = 90;
  const increment = (endLevel - startLevel) / totalDays;

  for (let i = totalDays; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // More realistic habit completion patterns
    const completed = [];
    if (Math.random() > 0.2) completed.push('1'); // Sunlight (80% completion)
    if (Math.random() > 0.3) completed.push('2'); // Training (70% completion)
    if (Math.random() > 0.25) completed.push('3'); // Sleep (75% completion)
    if (Math.random() > 0.4) completed.push('4'); // Nutrition (60% completion)

    // Calculate T-level with a clear upward trend
    const progressBonus = (totalDays - i) * increment;
    const habitBonus = completed.length * 5; // Each habit adds 5 ng/dL
    const randomVariation = Math.random() * 6 - 3; // Smaller random variation

    const tLevel = Math.round(startLevel + progressBonus + habitBonus + randomVariation);

    history.push({
      date: dateString,
      tLevel,
      completedHabits: completed,
    });
  }

  return history;
};

// Generate heatmap data for the calendar
const generateHeatmapData = (history: DailyProgress[]): HeatmapData => {
  const heatmap: HeatmapData = {};
  
  history.forEach(day => {
    const completedCount = day.completedHabits.length;
    let dotColor = 'transparent';
    
    if (completedCount === 1) dotColor = '#9DCEFF';
    else if (completedCount === 2) dotColor = '#6FB4FF';
    else if (completedCount === 3) dotColor = '#3F96FF';
    else if (completedCount >= 4) dotColor = '#06b4d3';
    
    heatmap[day.date] = {
      marked: completedCount > 0,
      dotColor: completedCount > 0 ? dotColor : undefined,
    };
  });
  
  return heatmap;
};

type ProgressContextType = {
  weeklyData: typeof weeklyData;
  monthlyData: typeof monthlyData;
  progressHistory: DailyProgress[];
  heatmapData: HeatmapData;
  updateProgress: (date: string, tLevel: number, completedHabits: string[]) => void;
  getHabitImpact: () => { habitId: string; impact: number }[];
  clearProgress: () => void;
};

const progressHistory = generateProgressHistory();
const heatmapData = generateHeatmapData(progressHistory);

const ProgressContext = createContext<ProgressContextType>({
  weeklyData,
  monthlyData,
  progressHistory,
  heatmapData,
  updateProgress: () => {},
  getHabitImpact: () => [],
  clearProgress: () => {},
});

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<DailyProgress[]>(progressHistory);
  const [heatmap, setHeatmap] = useState<HeatmapData>(heatmapData);

  const updateProgress = (date: string, tLevel: number, completedHabits: string[]) => {
    setHistory(prev => {
      const existingIndex = prev.findIndex(item => item.date === date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { date, tLevel, completedHabits };
        return updated;
      } else {
        return [...prev, { date, tLevel, completedHabits }];
      }
    });

    setHeatmap(prev => {
      const completedCount = completedHabits.length;
      let dotColor = 'transparent';
      
      if (completedCount === 1) dotColor = '#9DCEFF';
      else if (completedCount === 2) dotColor = '#6FB4FF';
      else if (completedCount === 3) dotColor = '#3F96FF';
      else if (completedCount >= 4) dotColor = '#06b4d3';
      
      return {
        ...prev,
        [date]: {
          marked: completedCount > 0,
          dotColor: completedCount > 0 ? dotColor : undefined,
        }
      };
    });
  };

  const clearProgress = () => {
    console.log('[ProgressContext] Clearing progress data');
    setHistory([]);
    setHeatmap({});
  };

  const getHabitImpact = () => {
    const last30Days = history.slice(-30);
    const impacts: Record<string, { total: number; count: number }> = {};

    last30Days.forEach(day => {
      day.completedHabits.forEach(habitId => {
        if (!impacts[habitId]) {
          impacts[habitId] = { total: 0, count: 0 };
        }
        impacts[habitId].total += day.tLevel;
        impacts[habitId].count += 1;
      });
    });

    return Object.entries(impacts)
      .map(([habitId, data]) => ({
        habitId,
        impact: ((data.total / data.count) - 450) / 450 * 100
      }))
      .sort((a, b) => b.impact - a.impact);
  };

  // Register the clearProgress function with the logout service
  React.useEffect(() => {
    registerContextSetters({ clearProgress });
  }, []);

  return (
    <ProgressContext.Provider value={{ 
      weeklyData, 
      monthlyData, 
      progressHistory: history, 
      heatmapData: heatmap,
      updateProgress,
      getHabitImpact,
      clearProgress
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => useContext(ProgressContext);