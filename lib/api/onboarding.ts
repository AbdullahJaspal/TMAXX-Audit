import { Lock, Moon, Scale, Activity, Brain, Dumbbell, Apple, Heart, Trophy, Sun, Zap, Megaphone, Calendar, Candy, SunIcon, CircleAlert, Droplet, Smile, AlertCircle } from 'lucide-react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.tmaxx.app';

export interface OnboardingScreen {
  id: string;
  type: 'start' | 'disclaimer' | 'date' | 'slider' | 'multipleChoice' | 'reinforcement' | 'account' | 'loading' | 'results' | 'heightWeight' | 'increment' | 'paywall' | 'reviewPrompt' | 'backupOffer';
  title: string;
  description: string;
  icon?: string | any;
  nextScreen: string | null;
  variant?: string;
  isReinforcement?: boolean;
  infoCard?: {
    title: string;
    text: string;
  };
  reinforcementContent?: {
    highlights?: Array<{
      icon: string | any;
      text: string;
    }>;
    notice?: string;
    subheading?: string;
    explanation?: string;
  };
  options?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  multiSelect?: boolean;
  showMetricToggle?: boolean;
  incrementConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
    defaultValue: number;
  };
  results?: {
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
    paywall?: boolean;
  };
  paywallContent?: {
    features: Array<{
      icon: string;
      label: string;
    }>;
    freeTrialLabel: string;
    freeTrialToggleDefault: boolean;
    trialMessaging: string;
    payNowMessaging: string;
    pricingOptions: Array<{
      label: string;
      price: string;
      value: string;
      badge?: string;
      dominant: boolean;
    }>;
    ctaLabel: string;
    ctaSubtext: string;
    footer: string;
      testimonial: {
    text: string;
    name: string;
    tLevel?: string;
    rating: number;
  };
  };
  reviewPromptContent?: {
    stars: number;
    highlightIcon: string;
    highlightText: string;
    reviews: Array<{
      avatar: string;
      username: string;
      boldText?: string;
      text: string;
    }>;
    ctaText: string;
  };
  backupOfferContent?: {
    headline: string;
    subheadline: string;
    price: string;
    billed: string;
    features: Array<string>;
    ctaLabel: string;
    footer: string;
    animationType?: string; // e.g., 'bounce', 'scale', etc.
  };
}

export interface OnboardingResultsResponse {
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

// Fallback onboarding screens - used when API is unavailable
const onboardingScreens: OnboardingScreen[] = [
  {
    id: 'disclaimer',
    type: 'disclaimer',
    title: 'This is a backup screen',
    description: "We're not doctors, and this app isn't a replacement for medical advice. But we are serious about helping you understand your body better.",
    icon: Lock,
    nextScreen: 'age',
    isReinforcement: true,
    reinforcementContent: {
      highlights: [
        {
          icon: Lock,
          text: 'Our recommendations are grounded in peer-reviewed science'
        },
        {
          icon: Scale,
          text: 'We use your responses to create a personalized roadmap for better energy, mood, and performance'
        },
        {
          icon: Lock,
          text: 'Your privacy matters: identifying info like your name and email is stored separately from your health data and habits. We use advanced encryption and never share your data.'
        }
      ]
    }
  },
  {
    id: 'age',
    type: 'date',
    title: 'When were you born?',
    description: 'Enter your birthday below so we can factor your age into your T-Maxx Plan.',
    icon:Calendar, 
    nextScreen: 'height-weight'
  },
  {
    id: 'height-weight',
    type: 'heightWeight',
    title: 'What is your Height & Weight?',
    description: 'Used to calculate BMI, which impacts your testosterone.',
    icon: Scale,
    nextScreen: 'sleep',
    showMetricToggle: true
  },
  {
    id: 'sleep',
    type: 'increment',
    title: 'How much sleep do you get?',
    description: 'Benchmark your sleep based on an average night',
    icon: Moon,
    nextScreen: 'activity',
    incrementConfig: {
      min: 4,
      max: 12,
      step: 0.5,
      unit: 'hours',
      defaultValue: 7
    },
    infoCard: {
      title: 'Did you know?',
      text: 'Research shows that men who sleep 8 hours per night have significantly higher testosterone levels than those who only get 4 hours.'
    }
  },
  {
    id: 'activity',
    type: 'multipleChoice',
    title: 'How much time do you spend sitting on a typical day?',
    description: 'This includes working at a desk, commuting, watching TV, or gaming',
    icon: Activity,
    nextScreen: 'marketing',
    options: [
      { value: 'less-than-4', label: 'Less than 4 hours' },
      { value: '4-6', label: '4-6 Hours' },
      { value: '6-9', label: '6-9 Hours' },
      { value: '9-12', label: '9-12 Hours' },
      { value: 'more-than-12', label: 'More than 12 Hours' }
    ]
  },
  {
    id: 'goals',
    type: 'multipleChoice',
    title: 'Why do you want to improve your testosterone levels?',
    description: 'Select the reasons that matter most to you',
    icon: Trophy,
    nextScreen: 'exercise',
    multiSelect: true,
    options: [
      { value: 'energy', label: 'Increase energy and fight fatigue' },
      { value: 'muscle', label: 'Build muscle and lose fat more easily' },
      { value: 'libido', label: 'Boost sex drive and performance' },
      { value: 'mood', label: 'Improve mood, confidence, and drive' },
      { value: 'focus', label: 'Enhance focus and mental clarity' },
      { value: 'sleep', label: 'Improve sleep quality and recovery' },
      { value: 'curious', label: "I'm just curious / want to understand my body better" }
    ]
  },
  {
    id: 'exercise',
    type: 'multipleChoice',
    title: 'What types of exercise do you engage in?',
    description: 'Select all that apply on a typical week.',
    icon: Dumbbell,
    nextScreen: 'exercise-frequency',
    multiSelect: true,
    options: [
      { 
        value: 'weightlifting',
        label: 'Weightlifting or resistance training',
        description: 'e.g., gym workouts, Beachbody, CrossFit, etc.'
      },
      {
        value: 'hiit',
        label: 'High-intensity interval training (HIIT)',
        description: 'e.g., sprints, circuit training, bootcamps'
      },
      {
        value: 'cardio',
        label: 'Steady-state cardio',
        description: 'e.g., running, biking, swimming, long walks'
      },
      {
        value: 'sports',
        label: 'Sports or recreational activities',
        description: 'e.g., basketball, soccer, tennis, martial arts'
      },
      {
        value: 'sedentary',
        label: 'Sedentary most days',
        description: 'I rarely work out or move intentionally'
      }
    ]
  },
  {
    id: 'exercise-frequency',
    type: 'increment',
    title: 'How often do you exercise?',
    description: "Baseline on a normal week for you right now. Not where you have been historically or where you'd like to be.",
    icon: Dumbbell,
    nextScreen: 'reinforcement-urgency',
    incrementConfig: {
      min: 0,
      max: 7,
      step: 1,
      unit: 'times per week',
      defaultValue: 3
    },
    infoCard: {
      title: 'Did you know?',
      text: 'Regular exercise is one of the most effective ways to naturally boost testosterone levels. Even 2-3 sessions per week can make a significant difference.'
    }
  },
  {
    id: 'reinforcement-urgency',
    type: 'reinforcement',
    title: "Why This Matters Now—Not 10 Years From Now",
    description: "Don't Wait Until It Gets Worse",
    icon: Brain,
    nextScreen: 'diet',
    isReinforcement: true,
    reinforcementContent: {
      highlights: [
        {
          icon: Brain,
          text: 'Testosterone levels have been dropping by 1% per year for decades—even in men under 30'
        },
        {
          icon: Heart,
          text: 'What used to be "normal" at 50 is now common at 25'
        }
      ],
      subheading: "Low testosterone is linked to:",
      explanation: "🩺 Higher risk of chronic illness\n🧠 Brain fog and low motivation\n💥 Loss of drive, muscle, and confidence\n\nThe earlier you catch the signs, the easier it is to turn things around.\n\nYour future self will thank you for starting now."
    }
  },
  {
    id: 'diet',
    type: 'multipleChoice',
    title: 'How would you describe your diet on a normal day?',
    description: 'Think back to the last 2-3 weeks. What types of food did you eat? Select all that apply.',
    icon: Apple,
    nextScreen: 'sugar',
    multiSelect: true,
    options: [
      { value: 'high-protein', label: 'High Protein' },
      { value: 'low-carb', label: 'Low Carb/Keto' },
      { value: 'high-carb', label: 'High Carb' },
      { value: 'processed', label: 'Processed Meals' },
      { value: 'fast-food', label: 'Fast Food' },
      { value: 'whole-foods', label: 'Whole Foods' },
      { value: 'plant-based', label: 'Plant Based' }
    ]
  },
  {
    id: 'sugar',
    type: 'multipleChoice',
    title: 'How often do you eat sugary snacks or desserts?',
    description: 'Think sweets, pastries, ice cream, candy, etc. - not counting naturally sweet foods like fruit.',
    icon:Candy,
    nextScreen: 'morning-wood',
    options: [
      { value: 'rarely', label: 'Rarely (less than once a week)' },
      { value: 'occasionally', label: '1-2 times per week' },
      { value: 'regularly', label: '3-5 times per week' },
      { value: 'daily', label: 'Daily' },
      { value: 'multiple', label: 'Multiple times per day' }
    ]
  },
  {
    id: 'morning-wood',
    type: 'multipleChoice',
    title: 'Do you wake up with morning wood?',
    description: 'Morning erections are a natural sign of healthy testosterone and blood flow. Choose the option that best reflects your experience over the past few weeks',
    icon:SunIcon,
    nextScreen: 'symptoms',
    options: [
      { value: 'daily', label: 'Almost Every Day' },
      { value: 'few-times', label: 'A few times a week' },
      { value: 'rarely', label: 'Rarely (once a week or less)' },
      { value: 'never', label: 'Not at all' },
      { value: 'unsure', label: "Not sure/haven't noticed" }
    ]
  },
  {
    id: 'symptoms',
    type: 'multipleChoice',
    title: 'Do you experience any of the following?',
    icon:AlertCircle,
    description: 'Check all that apply in your day-to-day life.',
    nextScreen: 'ejaculation',
    multiSelect: true,
    options: [
      { value: 'fatigue', label: 'Low energy or motivation' },
      { value: 'brain-fog', label: 'Brain fog or trouble concentrating' },
      { value: 'mood', label: 'Irritability or mood swings' },
      { value: 'depression', label: 'Feeling down or flat' },
      { value: 'muscle', label: 'Difficulty building or keeping muscle' },
      { value: 'fat', label: 'Stubborn body fat' },
      { value: 'none', label: 'None of the above' }
    ]
  },
  {
    id: 'ejaculation',
    type: 'multipleChoice',
    title: 'How often do you ejaculate?',
    description: 'Include sex or masturbation. This helps us understand your recovery, energy, and hormonal balance.',
    icon:Droplet,
    nextScreen: 'ejaculation-feeling',
    options: [
      { value: 'less-than-once', label: 'Less than once per week' },
      { value: '1-2', label: '1-2 Times per week' },
      { value: '3-5', label: '3-5 Times per week' },
      { value: '6-7', label: '6-7 times per week' },
      { value: '8-13', label: 'More than once per day (8-13x per week)' },
      { value: '14-plus', label: 'Multiple times per day (14+ times per week)' }
    ]
  },
  {
    id: 'ejaculation-feeling',
    type: 'multipleChoice',
    title: 'How do you usually feel after ejaculating?',
    description: "We're looking for patterns in energy, mood, and recovery. Select the answer that feels the most accurate",
    icon:Smile,
    nextScreen: 'reinforcement-not-alone',
    options: [
      { value: 'relaxed', label: 'Relaxed and calm' },
      { value: 'energized', label: 'Energized or motivated' },
      { value: 'tired', label: 'Tired or drained' },
      { value: 'foggy', label: 'Mentally foggy or unfocused' },
      { value: 'no-effect', label: 'No noticeable effect' }
    ]
  },
  {
    id: 'reinforcement-not-alone',
    type: 'reinforcement',
    title: "You're Not the Only One",
    description: "You're not lazy. You're not broken.\nYou're not alone.",
    nextScreen: 'review-prompt',
    isReinforcement: true,
    reinforcementContent: {
      highlights: [
        {
          icon: Brain,
          text: 'Millions of men are silently dealing with low energy, low sex drive, and feeling off... but not sure why'
        }
      ],
      explanation: "Most of them never take action.\n\nBut you're here. That already puts you in a different category—someone who wants to feel strong, sharp, and fully alive.\n\nLet's figure out what's holding you back."
    }
  },
  {
    id: 'account',
    type: 'account',
    title: 'Create your account to unlock your results',
    description: "We've built your personalized testosterone profile based on your answers.",
    nextScreen: 'loading',
    reinforcementContent: {
      highlights: [
        { icon: Lock, text: 'Save your data and progress' },
        { icon: Scale, text: 'Unlock your full results and recommendations' },
        { icon: Activity, text: 'Track your habits and improvements over time' }
      ],
      notice: 'Your data is encrypted and stored securely. We never sell your information.'
    }
  },
  {
    id: 'loading',
    type: 'loading',
    title: 'Building Your Testosterone Profile...',
    description: "We're building your personalized testosterone estimate and preparing custom recommendations designed to boost energy, mood, and performance.",
    nextScreen: 'results'
  },
  {
    id: 'results',
    type: 'results',
    title: 'Your Testosterone Profile',
    description: '',
    nextScreen: 'paywall',
    results: {
      testosteroneValue: 510,
      testosteroneUnit: 'ng/dL',
      testosteroneLabel: 'Your Estimated Testosterone Level',
      optimalLabel: 'Optimal (Age 26)',
      optimalValue: 750,
      optimalRangeNote: 'Most men feel best between 600–800 ng/dL.',
      findingsTitle: "What's Holding You Back",
      findings: [
        { emoji: '🛌', text: "You're averaging 5–6 hours of sleep per night" },
        { emoji: '🍩', text: 'High sugar intake may be spiking insulin' },
        { emoji: '🪑', text: 'Low physical activity is reducing natural T production' }
      ],
      planTitle: 'We Built You a Custom Plan',
      planDescription: "Based on your responses, we've created a plan to raise your testosterone naturally.",
      testimonial: {
        text: 'I followed the plan for 4 weeks and I genuinely feel like a new person. More energy, better sleep, and my wife noticed the difference too!',
        name: 'Michael, 42',
        rating: 5
      },
      protocolTitle: 'Your Starting Protocol',
      protocolNote: "You'll be able to customize this plan according to your preferences and schedule inside the app.",
      protocol: [
        { icon: 'Dumbbell', text: 'Lift 3x/week' },
        { icon: 'Sun', text: 'Sunlight before 10am' },
        { icon: 'Cut', text: 'Cut sugar to <3x/week' },
        { icon: 'Brain', text: 'Dopamine reset (3–5 days)' }
      ],
      progressTitle: 'Projected T-Levels',
      progressNote: 'Change your life in 90 days with 80% consistency',
      progress: [
        { x: 'May 1', value: 510 },
        { x: 'Jul 30', value: 650 }
      ],
      benefitsTitle: "Benefits You'll Notice",
      benefits: [
        { emoji: '🔥', text: 'Libido' },
        { emoji: '💪', text: 'Strength' },
        { emoji: '🧠', text: 'Focus' },
        { emoji: '😴', text: 'Sleep' },
        { emoji: '😊', text: 'Less Stress' }
      ],
      testimonial2: {
        text: 'After 8 weeks on this program, my energy levels are through the roof. I\'m back to my college weight and my partner keeps commenting on my improved mood. Worth every penny.',
        name: 'James, 38',
        tLevel: 'T-Level: 490 → 680',
        rating: 5
      },
      ctaText: 'Unlock My Plan + Start Today',
      ctaSubtext: 'Science-backed. Cancel anytime.',
      paywall: false
    }
  },
  {
    id: 'paywall',
    type: 'paywall',
    title: "Last step to get your T-boosting plan.",
    description: '',
    icon: Lock,
    nextScreen: 'backup-offer',
    paywallContent: {
      features: [
        { icon: 'Zap', label: 'T-level estimate' },
        { icon: 'Activity', label: 'Daily habit tracking' },
        { icon: 'FlaskConical', label: 'Science Backed' },
        { icon: 'Lock', label: '100% private' },
      ],
      freeTrialLabel: 'I want to try the app for free',
      freeTrialToggleDefault: true,
      trialMessaging: '3 days free, then $39.99/year. Cancel anytime.',
      payNowMessaging: 'Pay now and start your plan instantly.',
      pricingOptions: [
        {
          label: 'Weekly',
          price: '$4.99/week',
          value: 'weekly',
          badge: undefined,
          dominant: false
        },
        {
          label: 'Yearly',
          price: '$39.99/year',
          value: 'yearly',
          badge: 'Save 84% – Most Popular',
          dominant: true
        }
      ],
      ctaLabel: 'Start My Plan →',
      ctaSubtext: '3 days free, then PRICE. Cancel anytime.',
      footer: 'No risk. Cancel anytime. Your data stays private.',
      testimonial: {
        text: "After starting my plan, my energy and focus shot up. The daily tracking keeps me on point.",
        name: "Chris, 36",
        rating: 5
      }
    }
  },
  {
    id: 'backup-offer',
    type: 'backupOffer',
    title: 'Last Chance to Join for Just $1.67/month',
    description: 'This is a one-time offer. You won\'t see this again.',
    icon: Lock,
    nextScreen: null,
    backupOfferContent: {
      headline: '$1.67/month',
      subheadline: 'Billed $19.99/year',
      price: '$1.67/mo',
      billed: 'Billed $19.99 yearly',
      features: [
        'Personalized T-boosting plan',
        'Daily habit tracker & progress insights',
        'Premium workouts for hormone health',
        'Access to accountability squads'
      ],
      ctaLabel: 'Unlock for $1.67/mo',
      footer: 'Billed $19.99 yearly • Cancel anytime • Money-back guarantee',
      animationType: 'bounce',
    }
  },
  {
    id: 'review-prompt',
    type: 'reviewPrompt',
    title: 'Feeling fired up?',
    description: 'Let others know how Tmaxx helped you take control.',
    icon: Zap,
    nextScreen: 'account',
    reviewPromptContent: {
      stars: 5,
      highlightIcon: 'Zap',
      highlightText: 'Tmaxx was built for guys like you. Supported by 50,000+ members leveling up their energy, confidence, and drive.',
      reviews: [
        {
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          username: '@mikeboostT',
          boldText: 'Finally an app',
          text: 'that actually helps you stay consistent.'
        },
        {
          avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          username: '@jasontestmode',
          text: 'It feels good to have a routine that works.'
        },
        {
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          username: '@mikeboostT',
          boldText: 'Finally an app',
          text: 'that actually helps youstay consistent.'
        },
      ],
      ctaText: 'Next'
    }
  }
];

// Fallback function to get onboarding screens
const getOnboardingScreens = async (): Promise<OnboardingScreen[]> => {
  return onboardingScreens;
};

export class OnboardingAPI {
    async getOnboardingFlow(): Promise<OnboardingScreen[]> {
        try {
            console.log('Fetching onboarding flow');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            const response = await fetch(`${API_BASE_URL}/onboarding/flow`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                console.error('[OnboardingAPI] Failed to fetch onboarding flow:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });
                
                // Fallback to hardcoded data if API fails
                console.warn('[OnboardingAPI] Falling back to hardcoded onboarding data');
                return await getOnboardingScreens();
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[OnboardingAPI] Unexpected error fetching onboarding flow:', error);
            
            // Fallback to hardcoded data if API call fails
            console.warn('[OnboardingAPI] Falling back to hardcoded onboarding data due to error');
            try {
                return await getOnboardingScreens();
            } catch (fallbackError) {
                console.error('[OnboardingAPI] Fallback also failed:', fallbackError);
                throw new Error('Failed to load onboarding data from API or fallback');
            }
        }
    }

    async getResults(responses: any, authToken: string, signal?: AbortSignal): Promise<OnboardingResultsResponse> {
        console.log('🎯 [OnboardingAPI] getResults called:', {
            hasResponses: !!responses,
            responsesCount: responses ? Object.keys(responses).length : 0,
            hasAuthToken: !!authToken,
            authTokenLength: authToken ? authToken.length : 0,
            hasSignal: !!signal,
            timestamp: new Date().toISOString()
        });

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            };

            console.log('📡 [OnboardingAPI] Making API request to:', `${API_BASE_URL}/onboarding/results`);

            const response = await fetch(`${API_BASE_URL}/onboarding/results`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ responses }),
                signal,
            });

            console.log('📥 [OnboardingAPI] Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                timestamp: new Date().toISOString()
            });

            if (!response.ok) {
                console.error('[OnboardingAPI] Failed to fetch results:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });
                
                throw new Error(`Failed to fetch results: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [OnboardingAPI] Results data received:', {
                hasData: !!data,
                dataKeys: data ? Object.keys(data) : [],
                timestamp: new Date().toISOString()
            });
            return data;
        } catch (error) {
            // Check if this is an abort error
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('🚫 [OnboardingAPI] API call was aborted');
                throw error; // Re-throw abort errors
            }
            
            console.error('❌ [OnboardingAPI] Unexpected error fetching results:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching results');
        }
    }
}

// Simple validation function for onboarding screens
export const validateOnboardingScreen = (screen: OnboardingScreen): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!screen.id) errors.push('Screen ID is required');
  if (!screen.type) errors.push('Screen type is required');
  if (!screen.title) errors.push('Screen title is required');

  switch (screen.type) {
    case 'multipleChoice':
      if (!screen.options || screen.options.length === 0) {
        errors.push('Multiple choice screen requires options');
      }
      break;
    case 'increment':
      if (!screen.incrementConfig) {
        errors.push('Increment screen requires incrementConfig');
      }
      break;
    case 'paywall':
      if (!screen.paywallContent) {
        errors.push('Paywall screen requires paywallContent');
      }
      break;
    // Add more cases as needed
  }

  return { isValid: errors.length === 0, errors };
}; 