import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getUserStats, getUserProfile, updateUserProfile } from '@/lib/supabase/user';
import { registerContextSetters } from '@/lib/services/logoutService';
import * as Notifications from 'expo-notifications';

type NotificationSettings = {
  daily_reminder: boolean;
  habit_nudges: boolean;
  weekly_progress: boolean;
  has_permissions: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  profile_pic_url: string | null;
  notifications: NotificationSettings;
  squad_id: string | null;
  tLevel: number; // in ng/L
  streakDays: number;
  weeklyProgress: number;
  projectionData: Array<{ x: string; value: number }>;
  hasNotificationPermission: boolean;
};

type UserContextType = {
  user: User;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  checkNotificationPermission: () => Promise<boolean>;
};

const defaultUser: User = {
  id: '',
  name: '',
  email: '',
  profile_pic_url: null,
  notifications: {
    daily_reminder: true,
    habit_nudges: true,
    weekly_progress: true,
    has_permissions: false,
  },
  squad_id: null,
  tLevel: 0,
  streakDays: 0,
  weeklyProgress: 0,
  projectionData: [],
  hasNotificationPermission: false,
};

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  updateUser: () => {},
  refreshUser: async () => {},
  clearUser: () => {},
  checkNotificationPermission: async () => false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  const checkNotificationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermission = status === 'granted';
      
      console.log('hasPermission', hasPermission);
      
      // Update local state
      setUser(prevUser => ({
        ...prevUser,
        hasNotificationPermission: hasPermission,
      }));

      // Update database if permission state has changed
      if (user.notifications.has_permissions !== hasPermission) {
        console.log('Updating database notification permission state:', hasPermission);
        await updateUserProfile({
          notifications: { has_permissions: hasPermission }
        });
      }
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      // Add authentication guard
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('[UserContext] No authenticated user, skipping refresh');
        setUser(defaultUser);
        return;
      }

      // Get user profile (includes squad_id)
      const { profile, error: profileError } = await getUserProfile();
      if (profileError) throw profileError;

      // Get user stats
      const stats = await getUserStats();
      if (!stats) throw new Error('Failed to fetch user stats');

      // Check current notification permission
      const currentPermission = await checkNotificationPermission();
      
      // Check if database state matches current permission state
      const dbHasPermissions = profile?.notifications?.has_permissions;
      if (dbHasPermissions !== currentPermission) {
        console.log('Permission state mismatch - updating database:', {
          db: dbHasPermissions,
          current: currentPermission
        });
        await updateUserProfile({
          notifications: { has_permissions: currentPermission }
        });
      }

      // Combine profile and stats with proper defaults
      const updatedUser = {
        id: stats.user_id,
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        profile_pic_url: profile?.profile_pic_url ?? null,
        notifications: {
          daily_reminder: profile?.notifications?.daily_reminder ?? defaultUser.notifications.daily_reminder,
          habit_nudges: profile?.notifications?.habit_nudges ?? defaultUser.notifications.habit_nudges,
          weekly_progress: profile?.notifications?.weekly_progress ?? defaultUser.notifications.weekly_progress,
          has_permissions: currentPermission
        },
        squad_id: profile?.squad_id ?? null,
        tLevel: stats.estimated_level,
        streakDays: stats.user_streak_days,
        weeklyProgress: 0, // TODO: Add this to stats
        projectionData: Array.isArray(stats.t_projection_data) ? stats.t_projection_data : [],
        hasNotificationPermission: currentPermission,
      };

      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const clearUser = () => {
    console.log('[UserContext] Clearing user data');
    setUser(defaultUser);
  };

  // Register the clearUser function with the logout service
  useEffect(() => {
    registerContextSetters({ clearUser });
  }, []);

  useEffect(() => {
    // Get the authenticated user's ID and data when the component mounts
    const initUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await refreshUser();
      }
    };

    initUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await refreshUser();
      } else {
        setUser(defaultUser);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUser = (newUserData: Partial<User>) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, ...newUserData };
      console.log('Updated user context:', updatedUser);
      return updatedUser;
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser, refreshUser, clearUser, checkNotificationPermission }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserProvider;