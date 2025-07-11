import packageJson from '../../package.json';

// Get version from package.json
export const APP_VERSION = packageJson.version;

// Format version for display (e.g., "v1.0.0")
export const getDisplayVersion = (): string => {
  return `v${APP_VERSION}`;
};

// Get version for analytics (just the version string)
export const getAnalyticsVersion = (): string => {
  return APP_VERSION;
}; 