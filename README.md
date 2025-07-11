# Tmaxx Mobile App

A React Native mobile habit tracker designed to help men increase their testosterone through AI-based habit suggestions, progress tracking, and gamified reinforcement.

## Overview

Tmaxx is a comprehensive wellness app that combines scientific insights with behavioral psychology to help users optimize their testosterone levels. The app features:

- **Dynamic Onboarding Quiz**: Estimates testosterone percentile and identifies potential causes of low T (stress, sleep, diet, etc.)
- **Personalized Habit Plans**: AI-generated recommendations based on quiz responses
- **Progress Tracking**: Daily logging with streak tracking and visual analytics
- **Social Accountability**: Squad system for group motivation and support
- **Educational Content**: Contextual information about testosterone optimization

## Tech Stack

### Frontend
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Expo Router** for navigation
- **React Context** for state management
- **Lucide React Native** for icons
- **Victory Native** for charts and data visualization

### Backend
- **Flask API** (hosted at https://api.tmaxx.app)
- **Supabase** for database and authentication
- **Amplitude** for analytics
- **Sentry** for error tracking

### Development Tools
- **ESLint** for code linting
- **Prettier** for code formatting
- **EAS Build** for app distribution
- **Metro** bundler

## Architecture Highlights

### Dynamic Onboarding System
The onboarding flow is entirely dynamic and backend-driven:

- **Backend-Defined**: All questions, validation rules, and flow logic are defined in the Flask API
- **JSON Schema**: Onboarding screens are served as JSON and rendered dynamically
- **Dynamic Icons**: Uses Lucide React Native icons specified by name in the backend
- **Zero App Updates**: New questions or flow changes can be deployed without app store updates

### State Management
- **Context-based**: Uses React Context for global state (Auth, User, Progress, etc.)
- **Hooks Pattern**: Custom hooks for common functionality (`useAuth`, `useAppInitialization`)
- **Session Persistence**: Supabase handles auth state persistence across app restarts

### API Architecture
- **RESTful Design**: Clean API endpoints for onboarding, habits, progress, and squads
- **Type Safety**: Full TypeScript interfaces for all API responses
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Offline Fallbacks**: Graceful degradation when API is unavailable

## Core Functionality

### 1. Onboarding Quiz
- **Multi-step Assessment**: Age, lifestyle, symptoms, goals
- **Testosterone Estimation**: Calculates percentile and identifies optimization areas
- **Results Page**: Emotionally-driven presentation with personalized insights
- **Paywall Integration**: Optional premium unlock for detailed plans

### 2. Personalized Habit Plan
- **AI-Generated Recommendations**: Based on quiz responses and scientific literature
- **Habit Categories**: Sleep hygiene, exercise, diet, stress management, ejaculation frequency
- **Progress Tracking**: Daily logging with streak maintenance
- **Educational Content**: Contextual information for each habit

### 3. Habit Tracker
- **Daily Logging**: Simple yes/no tracking for selected habits
- **Streak Tracking**: Visual indicators for consistency
- **Progress Visualization**: Charts and analytics for motivation
- **Contextual Education**: Tips and information about each habit

### 4. Accountability Squad
- **Group Formation**: 2-5 member squads for social support
- **Daily Check-ins**: Optional group accountability features
- **Boosts System**: Gamified encouragement between members
- **Progress Sharing**: Anonymous progress updates within squads

## Setup Instructions

### Prerequisites
- Node.js 18+ and Yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd mobile
yarn install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration (optional for local development)
EXPO_PUBLIC_API_URL=https://api.tmaxx.app
```

### 3. Start Development Server
```bash
# Start Expo development server
yarn dev

# Or run directly on device/simulator
yarn ios     # iOS simulator
yarn android # Android emulator
```

### 4. Supabase Setup (Optional for Local Development)
If you need to run with a local Supabase instance:

1. Install Supabase CLI
2. Start local Supabase: `supabase start`
3. Update `.env` with local URLs
4. Run migrations: `supabase db reset`

### 5. API Development (Optional)
For backend development, the Flask API is hosted at https://api.tmaxx.app. Local development requires:

- Python 3.8+
- Flask and dependencies
- Database setup (PostgreSQL recommended)

## Folder Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── onboarding/        # Dynamic onboarding flow
├── components/             # Reusable UI components
│   ├── home/              # Home screen components
│   ├── onboarding/        # Onboarding-specific components
│   ├── plan/              # Plan screen components
│   ├── progress/          # Progress tracking components
│   ├── settings/          # Settings components
│   └── squads/            # Squad-related components
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── UserContext.tsx    # User profile data
│   ├── ProgressContext.tsx # Progress tracking
│   └── ...                # Other context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities and services
│   ├── api/               # API client and types
│   ├── supabase/          # Supabase client and utilities
│   ├── analytics/         # Analytics configuration
│   └── services/          # Business logic services
├── constants/             # App constants (colors, etc.)
├── types/                 # TypeScript type definitions
└── assets/                # Images, animations, etc.
```

### Key Architectural Patterns

- **Context-based State**: Global state managed through React Context
- **Custom Hooks**: Reusable logic encapsulated in hooks
- **API Abstraction**: Clean separation between UI and API calls
- **Type Safety**: Comprehensive TypeScript interfaces
- **Component Composition**: Reusable, composable UI components

## Key Notes for Contributing

### Onboarding Flow Updates
- **Backend Only**: Onboarding changes are made in the Flask API
- **No App Updates**: New questions or flow changes don't require app store updates
- **Schema Validation**: All onboarding screens are validated against TypeScript interfaces
- **Icon System**: Uses Lucide React Native icons specified by name

### Development Practices

#### Code Style
- **Prettier**: Automatic formatting with 2-space indentation
- **ESLint**: Code linting with Expo configuration
- **TypeScript**: Strict type checking enabled

#### Branch Naming
```
feature/onboarding-improvements
bugfix/auth-session-persistence
hotfix/critical-api-fix
```

#### PR Guidelines
1. **Type Safety**: All new code must be properly typed
2. **Error Handling**: Comprehensive error handling for user-facing features
3. **Analytics**: Track important user actions with Amplitude
4. **Testing**: Test on both iOS and Android before submitting
5. **Documentation**: Update relevant documentation for new features

#### CI/CD Process
- **EAS Build**: Automated builds for development, preview, and production
- **Expo Updates**: Over-the-air updates for non-native changes
- **App Store**: Manual submission for native code changes

### Common Development Tasks

#### Adding a New Habit Type
1. Update backend API to include new habit in onboarding results
2. Add habit type to Supabase schema
3. Update progress tracking components
4. Add educational content

#### Modifying Onboarding Flow
1. Update Flask API onboarding schema
2. Test with existing app version
3. Deploy API changes
4. No app update required

#### Adding New Analytics Events
1. Define event in `lib/analytics/events.ts`
2. Track in relevant components
3. Verify in Amplitude dashboard

## Getting Help

- **Documentation**: Check inline code comments and TypeScript interfaces
- **API Documentation**: Flask API endpoints documented in backend repo
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub discussions for questions and ideas


---

Welcome to the Tmaxx team! 🚀 