require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Read version from package.json
const packageJson = require('./package.json');

// Debug logging
console.log('Loading Supabase config:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Missing Supabase Environment Variables!\n',
    'Please ensure you have a .env file with the following variables:\n',
    '- EXPO_PUBLIC_SUPABASE_URL\n',
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

module.exports = {
  expo: {
    name: 'Tmaxx',
    slug: 'Tmaxx',
    version: packageJson.version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'tmaxx',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    ios: {
      buildNumber: "3",
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'Allow T-Maxx to access your photos to set your profile picture.',
        NSCameraUsageDescription: "Allow T-Maxx to use the camera to capture profile images or habits.",
        NSUserTrackingUsageDescription: "Allow T-Maxx to track your usage to improve the app."
      },
      bundleIdentifier: 'com.anonymous.Tmaxx',
      config: {
        usesNonExemptEncryption: false
      }
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-router',
        {
          origin: 'https://tmaxx.app',
        },
      ],
      'expo-web-browser',
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
    },
    android: {
      package: 'com.anonymous.Tmaxx',
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
      eas: {
        projectId: "f02b4ba6-080e-42d7-9d6b-422b81c822ee"
      }
    },
    owner: "tmaxx",
    scheme: "tmaxx",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/f02b4ba6-080e-42d7-9d6b-422b81c822ee"
    }
  },
}; 