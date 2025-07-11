const tintColorLight = '#06b4d3';
const tintColorDark = '#0da2bc';

export interface ThemeColors {
  // Base colors
  text: string;
  background: string;
  onboardingBackground: string;
  tint: string;
  primary: string;
  shadedPrimary: string;
  cardBackground: string;
  onboardingCardBackground: string;
  border: string;
  muted: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  
  // Component specific colors
  buttonBg: string;
  buttonText: string;
  ctaBg: string;
  ctaText: string;
  label: string;
  value: string;
  
  // Input specific colors
  optionBg: string;
  optionLabel: string;
  optionLabelSelected: string;
  continueButtonBg: string;
  continueButtonText: string;
  continueButtonDisabledBg: string;
  continueButtonTextDisabled: string;
  
  // Loading screen specific
  progressBar: string;
  footerText: string;
  
  // Backup offer specific
  yellowCardBg: string;
  secondaryText: string;
  featureText: string;
  timer: string;
  checkmark: string;
  footer: string;
  ctaDisabled: string;
}

const Colors: Record<'light' | 'dark', ThemeColors> = {
  light: {
    // Base colors
    text: '#1a1a1a',
    background: '#f8f9fa',
    onboardingBackground: '#fff',
    tint: tintColorLight,
    primary: '#00A3FF',
    shadedPrimary: '#EBF8FF',
    cardBackground: '#ffffff',
    onboardingCardBackground: '#f8f9fa',
    border: '#e6e6e6',
    muted: '#64748b',
    
    // Semantic colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    
    // UI specific colors
    buttonBg: '#fff',
    buttonText: '#00A3FF',
    ctaBg: '#00A3FF',
    ctaText: '#fff',
    label: '#64748b',
    value: '#1a1a1a',
    
    // Input specific colors
    optionBg: '#f8f9fa',
    optionLabel: '#1a1a1a',
    optionLabelSelected: '#00A3FF',
    continueButtonBg: '#00a3ff',
    continueButtonText: '#fff',
    continueButtonDisabledBg: '#E2E8F0',
    continueButtonTextDisabled: '#A0AEC0',
    
    // Loading screen specific
    progressBar: '#00A3FF',
    footerText: '#64748b',
    
    // Backup offer specific
    yellowCardBg: '#fef9e7',
    secondaryText: '#666',
    featureText: '#222',
    timer: '#d97706',
    checkmark: '#00A3FF',
    footer: '#888',
    ctaDisabled: '#bdbdbd',
  },
  dark: {
    // Base colors
    text: '#f2f2f2',
    background: '#18181b',
    onboardingBackground: '#18181b',
    tint: tintColorDark,
    primary: '#00A3FF',
    shadedPrimary: '#175179',
    cardBackground: '#1e1e1e',
    onboardingCardBackground: '#1e1e1e',
    border: '#2a2a2a',
    muted: '#94a3b8',
    
    // Semantic colors
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#ef4444',
    
    // UI specific colors
    buttonBg: '#23232b',
    buttonText: '#2563eb',
    ctaBg: '#00A3FF',
    ctaText: '#fff',
    label: '#a1a1aa',
    value: '#fff',
    
    // Input specific colors
    optionBg: '#23232b',
    optionLabel: '#fff',
    optionLabelSelected: '#60a5fa',
    continueButtonBg: '#2563eb',
    continueButtonText: '#fff',
    continueButtonDisabledBg: '#23232b',
    continueButtonTextDisabled: '#A0AEC0',
    
    // Loading screen specific
    progressBar: '#60a5fa',
    footerText: '#a1a1aa',
    
    // Backup offer specific
    yellowCardBg: '#27272a',
    secondaryText: '#a1a1aa',
    featureText: '#fff',
    timer: '#f59e0b',
    checkmark: '#00A3FF',
    footer: '#71717a',
    ctaDisabled: '#3f3f46',
  },
};

export default Colors;