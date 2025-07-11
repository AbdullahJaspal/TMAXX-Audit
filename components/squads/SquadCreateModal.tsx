import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import Colors from '@/constants/Colors';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createSquad } from '@/lib/supabase/squad';

type SquadCreateModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreateSquad: (squadId: string) => void;
};

const suggestedNames = [
  "The Testosterone Titans 💪",
  "Peak Performance Squad 🎯",
  "Alpha Alliance ⚡",
  "Strength Syndicate 🦁",
  "Optimal Force 🚀",
  "Elite Energy Crew 💫",
  "Power Progress Team 📈",
  "Victory Vault 🏆",
];

const MODAL_WIDTH = Math.min(Dimensions.get('window').width - 48, 400);

const SquadCreateModal: React.FC<SquadCreateModalProps> = ({
  visible,
  onClose,
  onCreateSquad,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [squadName, setSquadName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectName = (name: string) => {
    setSquadName(name);
    setError('');
  };

  const handleCreate = async () => {
    if (!squadName.trim()) {
      setError('Please enter a squad name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onCreateSquad(squadName.trim());
    } catch (err) {
      setError('Failed to create squad. Please try again.');
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

          <Text style={[styles.title, { color: colors.text }]}>Name Your Squad</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Choose a name that reflects your squad's energy and goals</Text>

          <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter squad name"
              placeholderTextColor={colors.muted}
              value={squadName}
              onChangeText={(text) => {
                setSquadName(text);
                setError('');
              }}
              maxLength={30}
            />
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : (
            <Text style={[styles.hint, { color: colors.muted }]}>Maximum 30 characters</Text>
          )}

          <Text style={[styles.suggestionsTitle, { color: colors.text }]}>Suggested Names</Text>

          <View style={styles.suggestionsScrollWrapper}>
            <ScrollView 
              style={styles.suggestionsContainer}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {suggestedNames.map((name, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionItem,
                    { 
                      backgroundColor: squadName === name ? colors.tint + '20' : colors.background,
                      borderColor: squadName === name ? colors.tint : colors.border,
                    }
                  ]}
                  onPress={() => handleSelectName(name)}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{name}</Text>
                  {squadName === name && <Check size={20} color={colors.tint} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: colors.tint,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Squad</Text>
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
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  suggestionsScrollWrapper: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  createButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default SquadCreateModal;