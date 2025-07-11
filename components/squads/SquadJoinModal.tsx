import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import Colors from '@/constants/Colors';
import { Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSquad } from '@/contexts/SquadContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';

type SquadJoinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSquadJoined?: (squadCode: string) => void;
};

const SquadJoinModal: React.FC<SquadJoinModalProps> = ({
  visible,
  onClose,
  onSquadJoined,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { joinSquad } = useSquad();
  const { track } = useAnalytics();
  const [squadCode, setSquadCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async () => {
    if (!squadCode.trim()) {
      setError('Please enter a squad code');
      return;
    }

    if (squadCode.trim().length !== 6) {
      setError('Please enter a valid 6-character squad code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await joinSquad(squadCode.trim().toUpperCase());
      
      // Track successful squad joining
      track(ANALYTICS_EVENTS.SQUAD_JOINED, {
        squad_code: squadCode.trim().toUpperCase(),
        join_time: new Date().toISOString(),
        join_source: 'squad_join_modal',
      });
      
      // Call the callback if provided
      if (onSquadJoined) {
        onSquadJoined(squadCode.trim().toUpperCase());
      }
      
      onClose();
      router.replace('/(tabs)/squad');
    } catch (err: any) {
      console.error('Join squad error:', err);
      
      // Track failed squad joining
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_context: 'squad_joining',
        squad_code: squadCode.trim().toUpperCase(),
        error_message: err.message || 'Failed to join squad',
      });
      
      setError(err.message || 'Failed to join squad. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Join a Squad</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Enter the squad code to join your friends</Text>

          <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter squad code"
              placeholderTextColor={colors.muted}
              value={squadCode}
              onChangeText={(text) => {
                setSquadCode(text.toUpperCase());
                setError('');
              }}
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : (
            <Text style={[styles.hint, { color: colors.muted }]}>Enter the 6-character code</Text>
          )}

          <TouchableOpacity
            style={[
              styles.joinButton,
              { 
                backgroundColor: colors.tint,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleVerifyCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.joinButtonText}>Join Squad</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  joinButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default SquadJoinModal;