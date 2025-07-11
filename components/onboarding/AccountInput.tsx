import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { ArrowRight, Mail, Lock, Apple, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingScreens } from '@/contexts/OnboardingScreensContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { useSentry } from '@/contexts/SentryContext';

interface Props {
  onContinue: () => void;
  reinforcementContent?: {
    highlights?: Array<{
      icon: string | any;
      text: string;
    }>;
    notice?: string;
  };
  screenId?: string; // For analytics tracking
  screenTitle?: string; // For analytics tracking
  variant?: string; // For analytics tracking
  screenNumber?: number; // For analytics tracking
}

export default function AccountInput({ onContinue, reinforcementContent, screenId, screenTitle, variant, screenNumber }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signUp } = useAuth();
  const { getIconComponent } = useOnboardingScreens();
  const { track } = useAnalytics();
  const { captureError } = useSentry();

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Note: Analytics tracking is handled in AuthContext
      await signUp(email, password);
      
      onContinue();
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('already registered') || 
          error.message?.includes('already exists') ||
          error.message?.includes('try signing in')) {
        setError('This email is already registered. Please try signing in instead.');
      } else if (error.message?.includes('valid email')) {
        setError('Please enter a valid email address.');
      } else if (error.message?.includes('Password') && 
                 (error.message?.includes('weak') || error.message?.includes('short') || error.message?.includes('minimum'))) {
        setError('Password must be at least 8 characters long.');
      } else if (error.message?.includes('Network error') || 
                 error.message?.includes('internet connection')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('Server error') || 
                 error.message?.includes('Database error')) {
        setError('Server error. Please try again in a few minutes.');
      } else {
        // Only track unknown/unexpected errors
        captureError(error, {
          context: 'AccountInput.handleSignUp',
          extra: {
            email: email,
            hasPassword: !!password,
            screenId,
            screenTitle,
            variant,
            screenNumber,
          },
        });
        
        setError(error.message || 'An error occurred during sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    // TODO: Implement social sign-in with Supabase
    onContinue();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.onboardingBackground }]}>
      {error && (
        <View style={[
          styles.errorContainer,
          { backgroundColor: colors.error }
        ]}>
          <AlertCircle size={20} color={colors.background} />
          <Text style={[
            styles.errorText,
            { color: colors.background }
          ]}>{error}</Text>
          {error.includes('already registered') && (
            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: colors.background }]}
              onPress={() => router.push('/login')}
            >
              <Text style={[styles.signInButtonText, { color: colors.error }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.onboardingCardBackground }
        ]}>
          <Mail size={20} color={colors.text} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              { color: colors.text }
            ]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.onboardingCardBackground }
        ]}>
          <Lock size={20} color={colors.text} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              { color: colors.text }
            ]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.muted}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.button,
          { backgroundColor: colors.primary }
        ]} 
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={[
          styles.buttonText,
          { color: colors.ctaText }
        ]}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Text>
        <ArrowRight size={20} color={colors.ctaText} />
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={[
          styles.dividerLine,
          { backgroundColor: colors.border }
        ]} />
        <Text style={[
          styles.dividerText,
          { color: colors.muted }
        ]}>or continue with</Text>
        <View style={[
          styles.dividerLine,
          { backgroundColor: colors.border }
        ]} />
      </View>

      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={[
            styles.socialButton,
            { backgroundColor: colors.onboardingCardBackground }
          ]}
          onPress={() => handleSocialSignIn('google')}>
          <View style={styles.socialIcon}>
            <Text style={[
              styles.googleIcon,
              { color: colors.text }
            ]}>G</Text>
          </View>
          <Text style={[
            styles.socialButtonText,
            { color: colors.text }
          ]}>Google</Text>
        </TouchableOpacity>

        {Platform.OS !== 'android' && (
          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: colors.onboardingCardBackground }
            ]}
            onPress={() => handleSocialSignIn('apple')}>
            <Apple size={20} color={colors.text} />
            <Text style={[
              styles.socialButtonText,
              { color: colors.text }
            ]}>Apple</Text>
          </TouchableOpacity>
        )}
      </View>

      {reinforcementContent?.highlights && (
        <View style={styles.highlights}>
          {reinforcementContent.highlights.map((highlight, index) => {
            const Icon = typeof highlight.icon === 'string' 
              ? getIconComponent(highlight.icon)
              : highlight.icon;
              
            return (
              <View key={index} style={[
                styles.highlight,
                { backgroundColor: colors.onboardingBackground }
              ]}>
                <Icon size={20} color={colors.text} />
                <Text style={[
                  styles.highlightText,
                  { color: colors.text }
                ]}>{highlight.text}</Text>
              </View>
            );
          })}
        </View>
      )}

      {reinforcementContent?.notice && (
        <Text style={[
          styles.notice,
          { color: colors.muted }
        ]}>{reinforcementContent.notice}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Removed flex: 1 to allow proper sizing within scroll views
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    gap: 12,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  socialButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  highlights: {
    marginTop: 24,
    gap: 8,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  highlightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  notice: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  signInButton: {
    padding: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});