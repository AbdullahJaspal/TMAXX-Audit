import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch, Modal, Linking, Image, Platform, StatusBar, Alert } from 'react-native';
import Colors from '@/constants/Colors';
import { Bell, Moon, Shield, RefreshCcw, Award, ChevronRight, LogOut, Users as Users2, Trash2, FileText, DollarSign, MailQuestion as QuestionMark, Mail, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useScreenTracking } from '@/components/analytics/withScreenTracking';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import { SCREEN_NAMES, ANALYTICS_EVENTS } from '@/lib/analytics';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import ProfileEditModal from '@/components/settings/ProfileEditModal';
import FAQModal from '@/components/settings/FAQModal';
import SentryTest from '@/components/SentryTest';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';
import { getUserProfile, updateUserProfile } from '@/lib/supabase/user';
import { getDisplayName, getAvatarLetter } from '@/lib/api/types';
import { formatRelativeTime } from '@/lib/utils/dateFormatters';
import { leaveSquad } from '@/lib/supabase/squad';
import { useToast } from '@/contexts/ToastContext';
import { useSquad } from '@/contexts/SquadContext';
import { SettingsAPI } from '@/lib/api/settings';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayVersion } from '@/lib/utils/version';
import { useUser } from '@/contexts/UserContext';
import * as Notifications from 'expo-notifications';

type UserProfile = {
  name: string | null;
  profile_pic_url: string | null;
  email: string;
};

type NotificationSettings = {
  daily_reminder: boolean;
  habit_nudges: boolean;
  weekly_progress: boolean;
  has_permissions?: boolean;
};

export default function SettingsScreen() {
  const { theme, toggleTheme, isSystemTheme, setSystemTheme } = useTheme();
  const colors = Colors[theme];
  const { squadName, squadId } = useSquad();
  const { track } = useAnalytics();
  const { signOut } = useAuth();
  const { user, checkNotificationPermission, refreshUser } = useUser();
  const { addBreadcrumb } = useSentry();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showNotificationPermissionModal, setShowNotificationPermissionModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const { showToast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    daily_reminder: true,
    habit_nudges: true,
    weekly_progress: true,
  });
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Track screen view
  useScreenTracking(SCREEN_NAMES.SETTINGS);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { profile, error } = await getUserProfile();
      if (error) throw error;

      if (profile) {
        setUserName(profile.name || '');
        setProfilePhoto(profile.profile_pic_url || undefined);
        setUserEmail(profile.email || '');
        if (profile.notifications) {
          setNotificationSettings(profile.notifications);
        }
      }
    } catch (error) {
      logError('Failed to fetch user profile', error instanceof Error ? error : new Error(String(error)), {
        context: 'settings_screen_profile_loading'
      });
    }
  };

  const handleNotificationToggle = async (type: keyof NotificationSettings) => {
    // Check if user has notification permission
    if (!user.hasNotificationPermission) {
      setShowNotificationPermissionModal(true);
      return;
    }

    try {
      const newSettings = {
        ...notificationSettings,
        [type]: !notificationSettings[type]
      };
      
      const { success } = await updateUserProfile({
        notifications: { [type]: newSettings[type] }
      });

      if (success) {
        setNotificationSettings(newSettings);
        // Track notification toggle
        track(ANALYTICS_EVENTS.SETTINGS_NOTIFICATION_TOGGLED, {
          notification_type: type,
          new_value: newSettings[type],
          previous_value: notificationSettings[type],
        });
      }
    } catch (error) {
      logError('Failed to update notification settings', error instanceof Error ? error : new Error(String(error)), {
        notification_type: type,
        new_value: !notificationSettings[type],
        context: 'settings_notification_toggle'
      });
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      // Track notification permission request result
      const permissionGranted = status === 'granted';
      track(ANALYTICS_EVENTS.ONBOARDING_NOTIFICATION_PERMISSION_REQUESTED, {
        permission_granted: permissionGranted,
        screen_id: 'settings',
        screen_title: 'Settings',
        variant: 'settings_modal',
        previous_permission_status: user.hasNotificationPermission ? 'granted' : 'denied',
      });

      if (status === 'granted') {
        await checkNotificationPermission();
        setShowNotificationPermissionModal(false);
        showToast('Notifications enabled!', 'success');
        // Refresh user context to update database state
        await refreshUser();
      } else {
        showToast('Notification permission denied', 'error');
      }
    } catch (error) {
      logError('Failed to request notification permission', error instanceof Error ? error : new Error(String(error)), {
        context: 'settings_notification_permission_request'
      });
      showToast('Failed to request notification permission', 'error');
    }
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
    setShowNotificationPermissionModal(false);
  };

  const handleDeleteAccount = () => {
    // Track delete account button click
    track(ANALYTICS_EVENTS.SETTINGS_DELETE_ACCOUNT_CLICKED, {
      has_squad: !!squadId,
      squad_name: squadName,
    });
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showToast('Authentication error', 'error');
        return;
      }

      const settingsApi = new SettingsAPI(session.access_token);
      const { success, error, message, debug } = await settingsApi.deleteAccount();

      if (!success) {
        logError('Delete account failed', error instanceof Error ? error : new Error(String(error)), {
          has_squad: !!squadId,
          squad_name: squadName,
          context: 'settings_account_deletion'
        });
        showToast(error || 'Failed to delete account', 'error');
        return;
      }

      // Track successful account deletion
      track(ANALYTICS_EVENTS.SETTINGS_DELETE_ACCOUNT_CONFIRMED, {
        has_squad: !!squadId,
        squad_name: squadName,
        deletion_message: message,
      });

      setDeleteMessage(message || '');
      setShowDeleteSuccess(true);
    } catch (error) {
      logError('Failed to delete user account', error instanceof Error ? error : new Error(String(error)), {
        has_squad: !!squadId,
        squad_name: squadName,
        context: 'settings_account_deletion'
      });
      showToast('An unexpected error occurred', 'error');
    }
  };

  const handleLeaveSquad = async () => {
    if (!squadId) {
      showToast('No squad to leave', 'error');
      return;
    }

    try {
      const { error } = await leaveSquad(squadId);
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      
      // Track successful squad leaving
      track(ANALYTICS_EVENTS.SETTINGS_LEAVE_SQUAD_CONFIRMED, {
        squad_id: squadId,
        squad_name: squadName,
      });
      
      showToast('Successfully left squad', 'success');
      setShowSquadModal(false);
      // Redirect to home or refresh the page
      router.replace('/');
    } catch (err) {
      logError('Failed to leave squad', err instanceof Error ? err : new Error(String(err)), {
        squad_id: squadId,
        squad_name: squadName,
        context: 'settings_squad_leaving'
      });
      showToast('Failed to leave squad', 'error');
    }
  };

  const handleProfileUpdate = async (name: string, photoUri?: string) => {
    try {
      const updates: { name?: string; profilePicUrl?: string } = {};

      // Only include name if it's different from current
      if (name !== userName) {
        updates.name = name;
      }

      // Only include photo if a new one is provided
      if (photoUri) {
        updates.profilePicUrl = photoUri;
      }

      // Only proceed if there are actual changes
      if (Object.keys(updates).length === 0) {
        return;
      }

      const { success } = await updateUserProfile(updates);

      if (success) {
        // Track profile update
        track(ANALYTICS_EVENTS.PROFILE_UPDATED, {
          updated_fields: Object.keys(updates),
          name_changed: updates.name !== undefined,
          photo_changed: updates.profilePicUrl !== undefined,
          new_name: updates.name,
        });

        if (updates.name) {
          setUserName(updates.name);
        }
        if (updates.profilePicUrl) {
          setProfilePhoto(updates.profilePicUrl);
        }
      }
    } catch (error) {
      logError('Failed to update user profile', error instanceof Error ? error : new Error(String(error)), {
        context: 'settings_profile_update'
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Track logout action
      track(ANALYTICS_EVENTS.SETTINGS_LOGOUT_CLICKED, {
        has_squad: !!squadId,
        squad_name: squadName,
      });
      
      // Use the AuthContext's signOut method which handles all context clearing
      // The AppNavigation will automatically redirect to /welcome when session becomes null
      await signOut();
      
      // Don't navigate manually - let AppNavigation handle it based on auth state
    } catch (error) {
      logError('Failed to log out', error instanceof Error ? error : new Error(String(error)), {
        context: 'settings_logout'
      });
      showToast('Error logging out. Please try again.', 'error');
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:hello@tmaxx.app?subject=Account%20Deletion%20Support');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Settings
          </Text>
          
          <TouchableOpacity 
            style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => setShowProfileEdit(true)}
          >
            {profilePhoto ? (
              <Image 
                source={{ uri: profilePhoto }} 
                style={styles.profilePhoto}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
                <Text style={styles.avatarText}>{userName ? userName[0].toUpperCase() : '?'}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{userName || 'Set your name'}</Text>
              <Text style={[styles.profileEmail, { color: colors.muted }]}>{userEmail}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { borderColor: colors.border }]}
              onPress={() => setShowProfileEdit(true)}
            >
              <Text style={[styles.editButtonText, { color: colors.tint }]}>Edit</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[
                  styles.settingText, 
                  { 
                    color: colors.text,
                    opacity: user.hasNotificationPermission ? 1 : 0.5
                  }
                ]}>Daily Reminders</Text>
              </View>
              <Switch
                value={user.hasNotificationPermission ? notificationSettings.daily_reminder : false}
                onValueChange={() => handleNotificationToggle('daily_reminder')}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[
                  styles.settingText, 
                  { 
                    color: colors.text,
                    opacity: user.hasNotificationPermission ? 1 : 0.5
                  }
                ]}>Habit Nudges</Text>
              </View>
              <Switch
                value={user.hasNotificationPermission ? notificationSettings.habit_nudges : false}
                onValueChange={() => handleNotificationToggle('habit_nudges')}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[
                  styles.settingText, 
                  { 
                    color: colors.text,
                    opacity: user.hasNotificationPermission ? 1 : 0.5
                  }
                ]}>Weekly Progress</Text>
              </View>
              <Switch
                value={user.hasNotificationPermission ? notificationSettings.weekly_progress : false}
                onValueChange={() => handleNotificationToggle('weekly_progress')}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <Moon size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <View style={styles.themeControls}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    isSystemTheme && { backgroundColor: colors.tint + '20' }
                  ]}
                  onPress={() => setSystemTheme(true)}
                >
                  <Text style={[
                    styles.themeOptionText,
                    { color: isSystemTheme ? colors.tint : colors.muted }
                  ]}>System</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    !isSystemTheme && { backgroundColor: colors.tint + '20' }
                  ]}
                  onPress={() => setSystemTheme(false)}
                >
                  <Text style={[
                    styles.themeOptionText,
                    { color: !isSystemTheme ? colors.tint : colors.muted }
                  ]}>Manual</Text>
                </TouchableOpacity>
                {!isSystemTheme && (
                  <Switch
                    value={theme === 'dark'}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.tint }}
                    thumbColor="#ffffff"
                  />
                )}
              </View>
            </View>
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                // Track squad membership button click
                track(ANALYTICS_EVENTS.SETTINGS_LEAVE_SQUAD_CLICKED, {
                  has_squad: !!squadId,
                  squad_name: squadName,
                });
                setShowSquadModal(true);
              }}
            >
              <View style={styles.settingLeft}>
                <Users2 size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Squad Membership</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingItem, { borderTopColor: colors.border }]}
              onPress={() => {
                // Track privacy button click
                track(ANALYTICS_EVENTS.SETTINGS_PRIVACY_CLICKED);
                Linking.openURL('http://tmaxx.app/privacy');
              }}
            >
              <View style={styles.settingLeft}>
                <Shield size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Privacy</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>
            
            {/* Temporarily disabled until ready
            <TouchableOpacity style={[styles.settingItem, { borderTopColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <RefreshCcw size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Retake Assessment</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>
            */}
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <View style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                // Track FAQ button click
                track(ANALYTICS_EVENTS.SETTINGS_FAQ_CLICKED);
                setShowFAQ(true);
              }}
            >
              <View style={styles.settingLeft}>
                <QuestionMark size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>FAQ & Support</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderTopColor: colors.border }]}
              onPress={() => {
                // Track affiliate button click
                track(ANALYTICS_EVENTS.SETTINGS_AFFILIATE_CLICKED);
                Linking.openURL('http://tmaxx.app/influencers');
              }}
            >
              <View style={styles.settingLeft}>
                <DollarSign size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Become an Affiliate</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderTopColor: colors.border }]}
              onPress={() => {
                // Track rate app button click
                track(ANALYTICS_EVENTS.SETTINGS_RATE_APP_CLICKED);
                // TODO: Add app store rating logic
              }}
            >
              <View style={styles.settingLeft}>
                <Award size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Rate the App</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderTopColor: colors.border }]}
              onPress={() => {
                // Track ToS button click
                track(ANALYTICS_EVENTS.SETTINGS_TOS_CLICKED);
                Linking.openURL('http://tmaxx.app/terms');
              }}
            >
              <View style={styles.settingLeft}>
                <FileText size={20} color={colors.text} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.text }]}>Terms of Service</Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.dangerZone, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
              <View style={styles.settingLeft}>
                <Trash2 size={20} color={colors.error} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.error }]}>Delete My Account</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderTopColor: colors.border }]}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <LogOut size={20} color={colors.error} style={styles.settingIcon} />
                <Text style={[styles.settingText, { color: colors.error }]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.versionText, { color: colors.muted }]}>
            Tmaxx {getDisplayVersion()}
          </Text>
          
          {/* Sentry Test Component - Development Only */}
          {__DEV__ && <SentryTest />}
          
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Leaving? 🤔
            </Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Most guys feel results start kicking in around Week 3–4.{'\n'}
              Consistency wins. 💪
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowDeleteConfirmation(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Keep Going
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  setShowDeleteConfirmation(false);
                  handleConfirmDelete();
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSquadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSquadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Squad Membership
            </Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              You're currently a member of{'\n'}
              <Text style={{ fontFamily: 'Inter-Bold' }}>{squadName || 'No Squad'}</Text>
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowSquadModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={handleLeaveSquad}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Leave Squad
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ProfileEditModal
        visible={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        currentName={userName}
        currentPhoto={profilePhoto}
        onSave={handleProfileUpdate}
      />

      <FAQModal
        visible={showFAQ}
        onClose={() => setShowFAQ(false)}
      />

      <Modal
        visible={showDeleteSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Account Deletion Requested
            </Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              {deleteMessage}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleEmailSupport}
              >
                <Mail size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Contact Support
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={async () => {
                  setShowDeleteSuccess(false);
                  // The AppNavigation will automatically redirect to /welcome when session becomes null
                  await signOut();
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNotificationPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Notification Permissions Required
            </Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              To receive daily reminders, please enable notifications in your device settings.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleRequestNotificationPermission}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Enable Notifications
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={handleOpenSettings}
              >
                <Settings size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Open Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  editButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    marginTop: 8,
  },
  settingsCard: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  dangerZone: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  versionText: {
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  themeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});