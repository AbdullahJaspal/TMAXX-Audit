import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Alert, Linking } from 'react-native';
import { Check, Lock, Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResults } from '@/contexts/ResultsContext';
import { useUser } from '@/contexts/UserContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSentry } from '@/contexts/SentryContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { logDebug, trackApiCall } from '@/lib/sentry/utils';
import { OnboardingAPI } from '@/lib/api/onboarding';
import Colors from '@/constants/Colors';

const loadingMessages = [
  '📊 Analyzing your responses...',
  '🧠 Evaluating lifestyle, diet, sleep, and stress data...',
  '💪 Assessing habits linked to testosterone optimization...',
  '🤖 Running predictive model against scientific benchmarks...',
];

const checklistItems = [
  'Diet and sugar intake analyzed',
  'Sleep quality evaluated',
  'Morning erections factored',
  'Exercise type categorized',
  'Prediction model complete',
];

const MINIMUM_LOADING_TIME = 10000; // 10 seconds minimum loading time

interface Props {
  onComplete: () => void;
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

export default function LoadingScreen({ onComplete, screenId, screenTitle, variant, screenNumber }: Props) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [apiResponseReceived, setApiResponseReceived] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { theme } = useTheme();
  const { session } = useAuth();
  const { getFormattedResponses } = useOnboarding();
  const { results: existingResults, setResults, setError: setResultsError } = useResults();
  const { track } = useAnalytics();
  const { captureError } = useSentry();
  const colors = Colors[theme];
  const { updateUser } = useUser();

  // Add AbortController to cancel API calls on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Add ref to track if API call has been made to prevent duplicates
  const hasMadeApiCallRef = useRef(false);
  
  // Add ref to track if the main effect has already run
  const hasRunMainEffectRef = useRef(false);
  
  // Animation cleanup refs
  const minimumTimerRef = useRef<number | null>(null);
  const messageIntervalRef = useRef<number | null>(null);
  const checklistIntervalRef = useRef<number | null>(null);

  // Helper function to start loading animations
  const startLoadingAnimations = () => {
    // Start minimum time counter
    minimumTimerRef.current = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, MINIMUM_LOADING_TIME);

    // Calculate durations for each segment
    const totalDuration = MINIMUM_LOADING_TIME * 0.9; // Leave 10% for final animation
    const segmentCount = 5;
    const segmentDuration = totalDuration / segmentCount;

    // Create a sequence of progress animations
    const progressSequence = [
      Animated.timing(progressAnimation, {
        toValue: 20,
        duration: segmentDuration,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 40,
        duration: segmentDuration,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 60,
        duration: segmentDuration,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 80,
        duration: segmentDuration,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 95,
        duration: segmentDuration,
        useNativeDriver: false,
      }),
    ];

    // Run the sequence
    Animated.sequence(progressSequence).start();

    // Rotate through messages
    messageIntervalRef.current = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        prev < loadingMessages.length - 1 ? prev + 1 : prev
      );
    }, MINIMUM_LOADING_TIME / loadingMessages.length);

    // Add checklist items one by one
    checklistIntervalRef.current = setInterval(() => {
      setCompletedItems((prev) => {
        if (prev.length < checklistItems.length) {
          return [...prev, prev.length];
        }
        return prev;
      });
    }, MINIMUM_LOADING_TIME / (checklistItems.length + 1));
  };

  // Helper function to cleanup animations
  const cleanupAnimations = () => {
    if (minimumTimerRef.current) {
      clearTimeout(minimumTimerRef.current);
      minimumTimerRef.current = null;
    }
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
    if (checklistIntervalRef.current) {
      clearInterval(checklistIntervalRef.current);
      checklistIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Create new AbortController for this component instance
    abortControllerRef.current = new AbortController();
    
    // Reset API call flag when component mounts
    hasMadeApiCallRef.current = false;
    
    // Reset main effect flag when component mounts
    hasRunMainEffectRef.current = false;

    return () => {
      // Abort any ongoing API calls when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cleanup any running animations
      cleanupAnimations();
    };
  }, []);

  // Add detailed logging for component lifecycle and session changes
  useEffect(() => {
    logDebug('LoadingScreen: Component state updated', {
      hasSession: !!session,
      sessionId: session?.user?.id,
      apiResponseReceived,
      minimumTimeElapsed,
      error,
    });
  }, [session, apiResponseReceived, minimumTimeElapsed, error]);

  // Track loading screen view
  useEffect(() => {
    // Ensure screenNumber is valid
    const validScreenNumber = typeof screenNumber === 'number' && screenNumber > 0 ? screenNumber : undefined;
    
    logDebug('LoadingScreen: Tracking screen view', {
      screen_id: screenId || 'loading',
      screen_title: screenTitle || 'Building Your Testosterone Profile...',
      screen_type: 'loading',
      screen_number: validScreenNumber,
      variant: variant || 'default',
    });
    
    track(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, {
      screen_id: screenId || 'loading',
      screen_title: screenTitle || 'Building Your Testosterone Profile...',
      screen_type: 'loading',
      screen_number: validScreenNumber,
      variant: variant || 'default',
    });
    
  }, [screenId, screenTitle, screenNumber, variant, track]);

  useEffect(() => {
    // Prevent the effect from running multiple times
    if (hasRunMainEffectRef.current) {
      logDebug('LoadingScreen: Main effect already run, skipping', {
        hasSession: !!session,
        sessionId: session?.user?.id,
      });
      return;
    }
    
    hasRunMainEffectRef.current = true;
    
    logDebug('LoadingScreen: Starting API fetch process', {
      hasSession: !!session,
      sessionId: session?.user?.id,
      accessToken: session?.access_token ? 'present' : 'missing',
    });

    // Add authentication guard - don't run the effect at all if no session
    if (!session?.access_token) {
      logDebug('LoadingScreen: No session token, skipping API call');
      return;
    }

    // Check if results are already available - if so, skip API call
    if (existingResults) {
      logDebug('LoadingScreen: Results already available, skipping API call', {
        hasResults: !!existingResults,
        testosteroneValue: existingResults.testosteroneValue,
        alreadyProcessed: existingResults.alreadyProcessed,
        lastProcessedDate: existingResults.lastProcessedDate,
      });
      
      // Set the existing results as received and start the completion flow
      setApiResponseReceived(true);
      
      // Track analytics for skipping API call due to existing results
      track(ANALYTICS_EVENTS.ONBOARDING_CACHED_RESULTS_USED, {
        screen_id: screenId || 'loading',
        screen_title: screenTitle || 'Building Your Testosterone Profile...',
        reason: 'existing_results_in_context',
        sessionId: session?.user?.id,
      });
      
      // Start animations and timers
      startLoadingAnimations();
      
      return () => {
        cleanupAnimations();
      };
    }

    // Start minimum time counter
    const minimumTimer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, MINIMUM_LOADING_TIME);

    // Call the real API
    const fetchResults = async () => {
      // Prevent duplicate API calls
      if (hasMadeApiCallRef.current) {
        logDebug('LoadingScreen: API call already made, skipping duplicate', {
          sessionId: session?.user?.id,
        });
        return;
      }
      
      hasMadeApiCallRef.current = true;
      
      try {
        trackApiCall('/onboarding/results', 'POST', {
          sessionId: session?.user?.id,
          hasResponses: !!getFormattedResponses(),
          responseCount: Object.keys(getFormattedResponses() || {}).length,
        });
        
        if (!session?.access_token) {
          throw new Error('No authentication token available');
        }

        const responses = getFormattedResponses();

        const onboardingAPI = new OnboardingAPI();
        const results = await onboardingAPI.getResults(responses, session.access_token, abortControllerRef.current?.signal);
        
        logDebug('LoadingScreen: Results received successfully', {
          resultsReceived: !!results,
          hasProgressData: !!results.progress,
          hasTestosteroneValue: !!results.testosteroneValue,
          alreadyProcessed: results.alreadyProcessed,
          lastProcessedDate: results.lastProcessedDate,
        });
        
        // Handle already processed case
        if (results.alreadyProcessed) {
          logDebug('LoadingScreen: Using cached onboarding results', {
            lastProcessedDate: results.lastProcessedDate,
            sessionId: session?.user?.id,
          });
          
          // Track analytics for cached results usage
          track(ANALYTICS_EVENTS.ONBOARDING_CACHED_RESULTS_USED, {
            screen_id: screenId || 'loading',
            screen_title: screenTitle || 'Building Your Testosterone Profile...',
            lastProcessedDate: results.lastProcessedDate,
            sessionId: session?.user?.id,
          });
        }
        
        // Store results in context
        setResults(results);
        setApiResponseReceived(true);
        
        updateUser({
          projectionData: results.progress || [],
          streakDays: 0,
          tLevel: results.testosteroneValue,
        });
        
      } catch (error) {
        // Check if this is an abort error (component unmounted)
        if (error instanceof Error && error.name === 'AbortError') {
          logDebug('LoadingScreen: API call was aborted due to component unmount');
          return; // Don't show error or update state for aborted calls
        }
        
        // Track API fetch errors that cause negative user experience
        captureError(error instanceof Error ? error : new Error('Unknown API error'), {
          context: 'LoadingScreen.fetchResults',
          extra: {
            sessionId: session?.user?.id,
            screenId,
            screenTitle,
            variant,
            screenNumber,
            hasResponses: !!getFormattedResponses(),
            responseCount: Object.keys(getFormattedResponses() || {}).length,
          },
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch results';
        setError(errorMessage);
        setResultsError(errorMessage);
        
        // Show error alert to user
        Alert.alert(
          'Error Loading Results',
          'We encountered an issue while processing your responses. Please try again or contact support if the problem persists.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setError(null);
                setResultsError(null);
                setApiResponseReceived(false);
                // Restart the loading process
                fetchResults();
              },
            },
            {
              text: 'Contact Support',
              onPress: () => {
                Linking.openURL('mailto:hello@tmaxx.app');
              },
            },
          ]
        );
      }
    };

    fetchResults();

    // Start animations and timers
    startLoadingAnimations();

    return () => {
      cleanupAnimations();
    };
  }, [getFormattedResponses]);

  // Only complete when both conditions are met and no error
  useEffect(() => {
    if (apiResponseReceived && minimumTimeElapsed && !error) {
      Animated.sequence([
        Animated.timing(progressAnimation, {
          toValue: 98,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnimation, {
          toValue: 100,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start();

      setTimeout(onComplete, 800);
    }
  }, [apiResponseReceived, minimumTimeElapsed, error]);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Building Your Testosterone Profile...
        </Text>

        <View style={[styles.progressContainer, { backgroundColor: colors.continueButtonDisabledBg }]}>
          <Animated.View 
            style={[styles.progressBar, { width: progressWidth, backgroundColor: colors.primary }]} 
          />
        </View>

        <Text style={[styles.loadingMessage, { color: colors.primary }]}>
          {loadingMessages[currentMessageIndex]}
        </Text>

        <View style={styles.checklist}>
          {checklistItems.map((item, index) => (
            <View key={index} style={[styles.checklistItem, { backgroundColor: colors.onboardingBackground }]}>
              <View style={[
                styles.checkmark,
                completedItems.includes(index) && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                {completedItems.includes(index) && (
                  <Check size={16} color={colors.ctaText} />
                )}
              </View>
              <Text style={[
                styles.checklistText,
                { color: colors.label },
                completedItems.includes(index) && {
                  ...styles.checklistTextCompleted,
                  color: colors.text
                }
              ]}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.description, { color: colors.muted }]}>
          We're building your personalized testosterone estimate and preparing custom recommendations designed to boost energy, mood, and performance.
        </Text>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Lock size={16} color={colors.label} />
            <Text style={[styles.footerText, { color: colors.label }]}>
              Your data is secure.
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Target size={16} color={colors.label} />
            <Text style={[styles.footerText, { color: colors.label }]}>
              Your insights are grounded in real research.
            </Text>
          </View>
        </View>

        {completedItems.length === checklistItems.length && (!apiResponseReceived || !minimumTimeElapsed) && (
          <Text style={[styles.almostThere, { color: colors.primary }]}>
            Almost there. Most guys are surprised by what they discover.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingMessage: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 32,
    textAlign: 'center',
  },
  checklist: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  checklistTextCompleted: {
    fontFamily: 'Inter-Medium',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  footer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  almostThere: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
});