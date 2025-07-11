import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { X, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';

type ProfileEditModalProps = {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  currentPhoto?: string;
  onSave: (name: string, photoUri?: string) => void;
};

export default function ProfileEditModal({
  visible,
  onClose,
  currentName,
  currentPhoto,
  onSave,
}: ProfileEditModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();
  const [name, setName] = useState(currentName);
  const [photoUri, setPhotoUri] = useState<string | undefined>(currentPhoto);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setPhotoUri(currentPhoto);
      setError(undefined);
    }
  }, [visible, currentName, currentPhoto]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        setError("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setPhotoUri(result.assets[0].uri);
        setError(undefined);
        
        // Track photo selection
        track(ANALYTICS_EVENTS.PROFILE_UPDATED, {
          updated_fields: ['photo'],
          photo_changed: true,
          photo_selection_source: 'image_picker',
        });
      }
    } catch (err) {
      setError("Failed to pick image");
      console.error("Image picker error:", err);
    }
  };

  const handleSave = () => {
    const newName = name !== currentName ? name : undefined;
    const newPhoto = photoUri !== currentPhoto ? photoUri : undefined;
    
    // Track save action if there are changes
    if (newName || newPhoto) {
      track(ANALYTICS_EVENTS.PROFILE_UPDATED, {
        updated_fields: [newName ? 'name' : null, newPhoto ? 'photo' : null].filter(Boolean),
        name_changed: !!newName,
        photo_changed: !!newPhoto,
        new_name: newName,
        save_source: 'profile_edit_modal',
      });
    }
    
    onSave(name, photoUri);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            Edit Profile
          </Text>

          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image 
                  source={{ uri: photoUri }} 
                  style={styles.photoPreview}
                />
                <TouchableOpacity
                  style={[styles.changePhotoButton, { backgroundColor: colors.background }]}
                  onPress={pickImage}
                >
                  <Text style={[styles.changePhotoText, { color: colors.text }]}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: colors.background }]}
                onPress={pickImage}
              >
                <ImageIcon size={24} color={colors.text} />
                <Text style={[styles.photoButtonText, { color: colors.text }]}>
                  Choose Photo
                </Text>
              </TouchableOpacity>
            )}
            
            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.muted }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    gap: 12,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    padding: 8,
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});