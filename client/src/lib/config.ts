// API Configuration
// 
// When running in production, the app connects to Railway backend.
// Set VITE_API_URL environment variable in Railway Dashboard.
// 
// For local development, leave empty to use relative URLs.

// Get API URL from environment variable (set in Railway) or use relative URLs
export const API_URL = import.meta.env.VITE_API_URL || '';

// Detect if running in Capacitor native app
export const isCapacitor = typeof window !== 'undefined' && 
  (window as any).Capacitor !== undefined;

// Get the base URL for API calls
export function getApiBaseUrl(): string {
  // If an API URL is configured (from environment variable), use it
  if (API_URL) {
    return API_URL;
  }
  
  // In Capacitor, we need an absolute URL
  if (isCapacitor) {
    console.warn('Running in Capacitor but no API_URL configured. API calls may fail.');
    console.warn('Set VITE_API_URL environment variable in Railway Dashboard.');
    return '';
  }
  
  // In browser/PWA, use relative URLs (same domain)
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
