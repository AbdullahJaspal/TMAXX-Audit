import { supabase } from '@/lib/supabase/client';
import { Alert } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// Utility function to convert base64 to blob
function base64ToBlob(base64: string, contentType: string): Blob {
  // Remove the data URL prefix if present
  const base64Data = base64.includes('base64,') 
    ? base64.split('base64,')[1] 
    : base64;

  // Convert base64 to binary string
  const binaryString = atob(base64Data);
  
  // Create a Uint8Array from the binary string
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create blob from Uint8Array
  return new Blob([bytes], { type: contentType });
}

type NotificationSettings = {
  daily_reminder: boolean;
  habit_nudges: boolean;
  weekly_progress: boolean;
  has_permissions?: boolean;
};

type UserProfile = {
  name: string | null;
  profile_pic_url: string | null;
  email: string;
  notifications: NotificationSettings;
  squad_id: string | null;
};

interface UserStats {
  user_id: string;
  name: string;
  estimated_level: number;
  user_streak_days: number;
  t_projection_data: Array<{ x: string; value: number }>;
}

export async function getUserProfile(): Promise<{ profile: UserProfile | null; error: any }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw authError || new Error('User not found');

    const { data: profile, error: profileError } = await supabase
      .from('user_profile_view')
      .select('name, profile_pic_url, email, notifications, squad_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Ensure notifications object exists with default values
    const notifications = profile?.notifications || {
      daily_reminder: true,
      habit_nudges: true,
      weekly_progress: true
    };

    return { 
      profile: { 
        ...profile, 
        notifications,
        squad_id: profile?.squad_id || null
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { profile: null, error };
  }
}

export async function uploadProfileImage(photoUri: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw authError || new Error('User not found');

    console.log('Original photo URI:', photoUri);

    // Step 1: Convert image to JPEG format
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      photoUri,
      [],
      { format: SaveFormat.JPEG }
    );

    console.log('Manipulated image URI:', manipulatedImage.uri);

    // Step 2: Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      throw new Error('Failed to read image file');
    }

    // Step 3: Upload to Supabase
    const fileName = `${user.id}-${Date.now()}.jpg`;
    console.log('Generated file name:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Step 4: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    console.log('Public URL result:', publicUrlData);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) throw new Error('Failed to get public URL');

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return { url: null, error };
  }
}

// Utility function to decode base64 to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function updateUserProfile({
  name,
  profilePicUrl,
  notifications,
}: {
  name?: string;
  profilePicUrl?: string;
  notifications?: Partial<NotificationSettings>;
}) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw authError || new Error('User not found');

    // Step 1: Check if user row exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, notifications')
      .eq('id', user.id)
      .single();

    if (fetchError || !existingUser) {
      throw new Error('User profile does not exist. Cannot update.');
    }

    // Step 2: If there's a new profile picture, upload it
    let finalProfilePicUrl = profilePicUrl;
    if (profilePicUrl && profilePicUrl.startsWith('file://')) {
      const { url, error: uploadError } = await uploadProfileImage(profilePicUrl);
      if (uploadError) throw uploadError;
      if (url) {
        finalProfilePicUrl = url;
      }
    }

    // Step 3: Prepare updates object with only provided fields
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updates.name = name;
    }

    if (finalProfilePicUrl !== undefined) {
      updates.profile_pic_url = finalProfilePicUrl;
    }

    // Handle notifications update
    if (notifications) {
      updates.notifications = {
        ...existingUser.notifications,
        ...notifications
      };
    }

    // Only proceed with update if we have fields to update
    if (Object.keys(updates).length <= 1) { // Only contains updated_at
      return { success: true };
    }

    console.log('Auth ID:', user.id);
    console.log('Update payload:', updates);

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    Alert.alert('Error', 'There was a problem updating your profile.');
    return { success: false, error };
  }
}

export async function getUserStats(): Promise<UserStats | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw authError || new Error('User not found');

    const { data, error } = await supabase
      .from('user_stats_view')
      .select('user_id, name, estimated_level, user_streak_days, t_projection_data')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }

    // Ensure t_projection_data is an array
    const stats = {
      ...data,
      t_projection_data: Array.isArray(data.t_projection_data) ? data.t_projection_data : []
    };

    return stats;
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return null;
  }
}

export async function updateTimezone(timezone: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.rpc('update_timezone_if_changed', {
      p_timezone: timezone
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating timezone:', error);
    return { success: false, error };
  }
}