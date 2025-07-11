import React, { createContext, useContext, useState, ReactNode } from 'react';
import { registerContextSetters } from '@/lib/services/logoutService';

interface OnboardingState {
  dob: string | null;
  height: number | null;
  weight: number | null;
  heightUnit: 'imperial' | 'metric' | null;
  weightUnit: 'imperial' | 'metric' | null;
  sleep: number | null;
  activity: string | null;
  goals: string[];
  exercise: string[];
  exerciseFrequency: number | null;
  diet: string[];
  sugar: string | null;
  morningWood: string | null;
  symptoms: string[];
  ejaculation: string | null;
  ejaculationFeeling: string | null;
}

interface OnboardingContextType extends OnboardingState {
  setDob: (dob: string) => void;
  setHeight: (height: number) => void;
  setWeight: (weight: number) => void;
  setHeightUnit: (unit: 'imperial' | 'metric') => void;
  setWeightUnit: (unit: 'imperial' | 'metric') => void;
  setSleep: (sleep: number) => void;
  setActivity: (activity: string) => void;
  setGoals: (goals: string[]) => void;
  setExercise: (exercise: string[]) => void;
  setExerciseFrequency: (frequency: number) => void;
  setDiet: (diet: string[]) => void;
  setSugar: (sugar: string) => void;
  setMorningWood: (morningWood: string) => void;
  setSymptoms: (symptoms: string[]) => void;
  setEjaculation: (ejaculation: string) => void;
  setEjaculationFeeling: (feeling: string) => void;
  getFormattedResponses: () => any;
  clearResponses: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [dob, setDob] = useState<string | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [heightUnit, setHeightUnit] = useState<'imperial' | 'metric' | null>(null);
  const [weightUnit, setWeightUnit] = useState<'imperial' | 'metric' | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [exercise, setExercise] = useState<string[]>([]);
  const [exerciseFrequency, setExerciseFrequency] = useState<number | null>(null);
  const [diet, setDiet] = useState<string[]>([]);
  const [sugar, setSugar] = useState<string | null>(null);
  const [morningWood, setMorningWood] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [ejaculation, setEjaculation] = useState<string | null>(null);
  const [ejaculationFeeling, setEjaculationFeeling] = useState<string | null>(null);

  const getFormattedResponses = () => {
    const responses = {
      dob,
      height,
      weight,
      heightUnit,
      weightUnit,
      sleep,
      activity,
      goals,
      exercise,
      'exercise-frequency': exerciseFrequency,
      diet,
      sugar,
      'morning-wood': morningWood,
      symptoms,
      ejaculation,
      'ejaculation-feeling': ejaculationFeeling,
    };
    
    console.log('[OnboardingContext] Formatted responses:', responses);
    return responses;
  };

  const clearResponses = () => {
    setDob(null);
    setHeight(null);
    setWeight(null);
    setHeightUnit(null);
    setWeightUnit(null);
    setSleep(null);
    setActivity(null);
    setGoals([]);
    setExercise([]);
    setExerciseFrequency(null);
    setDiet([]);
    setSugar(null);
    setMorningWood(null);
    setSymptoms([]);
    setEjaculation(null);
    setEjaculationFeeling(null);
  };

  // Register the clearResponses function with the logout service
  React.useEffect(() => {
    registerContextSetters({ clearResponses });
  }, []);

  const value = {
    dob,
    height,
    weight,
    heightUnit,
    weightUnit,
    sleep,
    activity,
    goals,
    exercise,
    exerciseFrequency,
    diet,
    sugar,
    morningWood,
    symptoms,
    ejaculation,
    ejaculationFeeling,
    setDob,
    setHeight,
    setWeight,
    setHeightUnit,
    setWeightUnit,
    setSleep,
    setActivity,
    setGoals,
    setExercise,
    setExerciseFrequency,
    setDiet,
    setSugar,
    setMorningWood,
    setSymptoms,
    setEjaculation,
    setEjaculationFeeling,
    getFormattedResponses,
    clearResponses,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 