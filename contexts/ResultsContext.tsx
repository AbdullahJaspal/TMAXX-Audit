import React, { createContext, useContext, useState, ReactNode } from 'react';
import { registerContextSetters } from '@/lib/services/logoutService';

interface ResultsData {
  alreadyProcessed?: boolean;
  lastProcessedDate?: string;
  testosteroneValue: number;
  testosteroneUnit: string;
  testosteroneLabel: string;
  optimalLabel: string;
  optimalValue: number;
  optimalRangeNote: string;
  findingsTitle: string;
  findings: Array<{
    emoji: string;
    text: string;
  }>;
  planTitle: string;
  planDescription: string;
  testimonial: {
    text: string;
    name: string;
    tLevel?: string;
    rating: number;
  };
  protocolTitle: string;
  protocolNote: string;
  protocol: Array<{
    icon: string;
    text: string;
  }>;
  progressTitle: string;
  progressNote: string;
  progress: Array<{
    x: string;
    value: number;
  }>;
  benefitsTitle: string;
  benefits: Array<{
    emoji: string;
    text: string;
  }>;
  testimonial2: {
    text: string;
    name: string;
    tLevel: string;
    rating: number;
  };
  ctaText: string;
  ctaSubtext: string;
  paywall: boolean;
}

interface ResultsContextType {
  results: ResultsData | null;
  setResults: (results: ResultsData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearResults: () => void;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearResults = () => {
    setResults(null);
    setError(null);
    setIsLoading(false);
  };

  // Register the clearResults function with the logout service
  React.useEffect(() => {
    registerContextSetters({ clearResults });
  }, []);

  const value = {
    results,
    setResults,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearResults,
  };

  return (
    <ResultsContext.Provider value={value}>
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error('useResults must be used within a ResultsProvider');
  }
  return context;
} 