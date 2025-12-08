// API Configuration for Capacitor iOS app
// 
// When running in Xcode simulator, the app needs to connect to your Replit backend.
// Replace the URL below with your actual Replit URL.
// 
// To find your URL:
// 1. Open your Replit project
// 2. Look at the Webview panel URL or click "Open in new tab"
// 3. Copy the URL (e.g., https://your-project.your-username.replit.app)

// Set this to your Replit URL when testing in Xcode
// Leave empty ('') to use relative URLs (for web/PWA mode)
export const REPLIT_API_URL = 'https://componentlibrary.mlgpro64.replit.app';

// Detect if running in Capacitor native app
export const isCapacitor = typeof window !== 'undefined' && 
  (window as any).Capacitor !== undefined;

// Get the base URL for API calls
export function getApiBaseUrl(): string {
  // If a Replit URL is configured, use it
  if (REPLIT_API_URL) {
    return REPLIT_API_URL;
  }
  
  // In Capacitor, we need an absolute URL
  if (isCapacitor) {
    // Default to empty - user must set REPLIT_API_URL
    console.warn('Running in Capacitor but no REPLIT_API_URL configured. API calls may fail.');
    return '';
  }
  
  // In browser/PWA, use relative URLs
  return '';
}

// Build full API URL
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    return `${baseUrl}${path}`;
  }
  return path;
}
