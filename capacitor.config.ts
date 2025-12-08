import type { CapacitorConfig } from '@capacitor/cli';

// Set your Replit URL here for iOS development
// To find your URL: it's shown in the Webview panel, like: https://your-project.your-username.replit.app
const REPLIT_URL = process.env.REPLIT_URL || '';

const config: CapacitorConfig = {
  appId: 'com.tharwa.app',
  appName: 'THARWA',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development: uncomment the next line and set your Replit URL
    // url: 'https://your-project.your-username.replit.app',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0d1a',
    scheme: 'TaskField',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0d1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#3b5bff',
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#0a0d1a',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
