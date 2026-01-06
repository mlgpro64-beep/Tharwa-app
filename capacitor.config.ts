import type { CapacitorConfig } from '@capacitor/cli';
import { networkInterfaces } from 'os';

// Function to get local IP address
function getLocalIP(): string | null {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return null;
}

// Determine server URL for development only
// Priority: 1. NGROK_URL, 2. VITE_API_URL, 3. Local IP
// In production, this returns undefined to use bundled files
const getServerUrl = (): string | undefined => {
  // Only set server URL in development mode
  if (process.env.NODE_ENV !== 'development') {
    return undefined;
  }
  
  if (process.env.NGROK_URL) {
    return process.env.NGROK_URL;
  }
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  
  // For local development, use local IP if available
  const localIP = getLocalIP();
  if (localIP) {
    const port = process.env.PORT || '5000';
    return `http://${localIP}:${port}`;
  }
  
  return undefined;
};

const serverUrl = getServerUrl();

const config: CapacitorConfig = {
  appId: 'com.tharwa.app',
  appName: 'THARWA',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development: uses NGROK_URL, VITE_API_URL, or local IP
    // For production: url is undefined, so bundled files are used
    ...(serverUrl ? { url: serverUrl } : {}),
    // Only allow cleartext in development
    ...(process.env.NODE_ENV === 'development' ? { cleartext: true } : {}),
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
