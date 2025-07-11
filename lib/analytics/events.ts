// Event names
export const ANALYTICS_EVENTS = {
  // App lifecycle events
  APP_LAUNCHED: 'app_launched',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_FOREGROUNDED: 'app_foregrounded',
  
  // Screen events
  SCREEN_VIEWED: 'screen_viewed',
  
  // User action events
  USER_ACTION: 'user_action',
  BUTTON_CLICKED: 'button_clicked',
  FORM_SUBMITTED: 'form_submitted',
  FORM_FIELD_CHANGED: 'form_field_changed',
  
  // Feature usage events
  FEATURE_USED: 'feature_used',
  
  // Onboarding events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_SCREEN_VIEWED: 'onboarding_screen_viewed',
  ONBOARDING_SELECTION_MADE: 'onboarding_selection_made',
  ONBOARDING_NOTIFICATION_PERMISSION_REQUESTED: 'onboarding_notification_permission_requested',
  ONBOARDING_CACHED_RESULTS_USED: 'onboarding_cached_results_used',
  
  // Authentication events
  LOGIN_ATTEMPTED: 'login_attempted',
  LOGIN_SUCCESSFUL: 'login_successful',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SIGNUP_ATTEMPTED: 'signup_attempted',
  SIGNUP_SUCCESSFUL: 'signup_successful',
  SIGNUP_FAILED: 'signup_failed',
  
  // Habit events
  HABIT_CREATED: 'habit_created',
  HABIT_UPDATED: 'habit_updated',
  HABIT_DELETED: 'habit_deleted',
  HABIT_COMPLETED: 'habit_completed',
  HABIT_SKIPPED: 'habit_skipped',
  HABIT_STREAK_UPDATED: 'habit_streak_updated',
  
  // Progress events
  PROGRESS_VIEWED: 'progress_viewed',
  PROGRESS_SHARED: 'progress_shared',
  
  // Squad events
  SQUAD_CREATED: 'squad_created',
  SQUAD_JOINED: 'squad_joined',
  SQUAD_LEFT: 'squad_left',
  SQUAD_INVITE_SENT: 'squad_invite_sent',
  SQUAD_INVITE_ACCEPTED: 'squad_invite_accepted',
  SQUAD_INVITE_DECLINED: 'squad_invite_declined',
  SQUAD_INVITE_BUTTON_CLICKED: 'squad_invite_button_clicked',
  SQUAD_INVITE_CODE_COPIED: 'squad_invite_code_copied',
  SQUAD_SHARE_MENU_OPENED: 'squad_share_menu_opened',
  SQUAD_INVITE_MESSAGE_COPIED: 'squad_invite_message_copied',
  SQUAD_MEMBER_BOOSTED: 'squad_member_boosted',
  SQUAD_PROFILE_OPENED: 'squad_profile_opened',
  SQUAD_CREATE_BUTTON_CLICKED: 'squad_create_button_clicked',
  SQUAD_JOIN_BUTTON_CLICKED: 'squad_join_button_clicked',
  
  // Settings events
  SETTINGS_CHANGED: 'settings_changed',
  PROFILE_UPDATED: 'profile_updated',
  SETTINGS_NOTIFICATION_TOGGLED: 'settings_notification_toggled',
  SETTINGS_PRIVACY_CLICKED: 'settings_privacy_clicked',
  SETTINGS_FAQ_CLICKED: 'settings_faq_clicked',
  SETTINGS_AFFILIATE_CLICKED: 'settings_affiliate_clicked',
  SETTINGS_RATE_APP_CLICKED: 'settings_rate_app_clicked',
  SETTINGS_TOS_CLICKED: 'settings_tos_clicked',
  SETTINGS_DELETE_ACCOUNT_CLICKED: 'settings_delete_account_clicked',
  SETTINGS_DELETE_ACCOUNT_CONFIRMED: 'settings_delete_account_confirmed',
  SETTINGS_LOGOUT_CLICKED: 'settings_logout_clicked',
  SETTINGS_LEAVE_SQUAD_CLICKED: 'settings_leave_squad_clicked',
  SETTINGS_LEAVE_SQUAD_CONFIRMED: 'settings_leave_squad_confirmed',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  
  // Subscription events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  PAYMENT_FAILED: 'payment_failed',
} as const;

// Screen names
export const SCREEN_NAMES = {
  // Auth screens
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT_PASSWORD: 'forgot_password',
  RESET_PASSWORD: 'reset_password',
  
  // Main app screens
  HOME: 'home',
  PLAN: 'plan',
  PROGRESS: 'progress',
  SQUAD: 'squad',
  SETTINGS: 'settings',
  
  // Onboarding screens
  ONBOARDING_WELCOME: 'onboarding_welcome',
  ONBOARDING_ACCOUNT: 'onboarding_account',
  ONBOARDING_HEIGHT_WEIGHT: 'onboarding_height_weight',
  ONBOARDING_SLEEP: 'onboarding_sleep',
  ONBOARDING_RESULTS: 'onboarding_results',
  
  // Modal screens
  HABIT_LIBRARY_MODAL: 'habit_library_modal',
  SQUAD_CREATE_MODAL: 'squad_create_modal',
  SQUAD_JOIN_MODAL: 'squad_join_modal',
  PROFILE_EDIT_MODAL: 'profile_edit_modal',
  FAQ_MODAL: 'faq_modal',
} as const;

// User properties
export const USER_PROPERTIES = {
  HAS_COMPLETED_ONBOARDING: 'has_completed_onboarding',
  SUBSCRIPTION_STATUS: 'subscription_status',
  USER_TYPE: 'user_type',
  JOIN_DATE: 'join_date',
  TOTAL_HABITS: 'total_habits',
  ACTIVE_HABITS: 'active_habits',
  LONGEST_STREAK: 'longest_streak',
  CURRENT_STREAK: 'current_streak',
  SQUAD_MEMBER: 'squad_member',
  SQUAD_OWNER: 'squad_owner',
} as const;

// Event property types
export interface BaseEventProperties {
  timestamp?: string;
  user_id?: string;
  session_id?: string;
}

export interface ScreenViewProperties extends BaseEventProperties {
  screen_name: string;
  screen_category?: string;
  previous_screen?: string;
  time_on_screen?: number;
}

export interface UserActionProperties extends BaseEventProperties {
  action: string;
  action_category?: string;
  action_target?: string;
  action_value?: any;
}

export interface FeatureUsageProperties extends BaseEventProperties {
  feature: string;
  feature_category?: string;
  usage_count?: number;
  usage_duration?: number;
}

export interface ErrorProperties extends BaseEventProperties {
  error_message: string;
  error_stack?: string;
  error_name: string;
  error_context?: Record<string, any>;
}

export interface NotificationPermissionProperties extends BaseEventProperties {
  permission_granted: boolean;
  screen_id: string;
  screen_title: string;
  variant?: string;
  screen_number?: number;
  previous_permission_status?: string;
}

// Type for all event names
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// Type for all screen names
export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];

// Type for all user properties
export type UserProperty = typeof USER_PROPERTIES[keyof typeof USER_PROPERTIES]; 