// API Configuration
// 
// When running in production, the app connects to Railway backend.
// Set VITE_API_URL environment variable in Railway Dashboard.
// 
// For local development, leave empty to use relative URLs.

// Get API URL from environment variable (set in Railway) or use relative URLs
// In production, if VITE_API_URL is not set, use the current domain
let envApiUrl = import.meta.env.VITE_API_URL || '';

// Reject any Replit URLs - always use relative paths or the configured domain
if (envApiUrl && envApiUrl.includes('replit.dev')) {
  console.warn('⚠️ Replit URL detected in VITE_API_URL. Using relative paths instead.');
  envApiUrl = '';
}

export const API_URL = envApiUrl || 
  (import.meta.env.PROD ? window.location.origin : '');

// Detect if running in Capacitor native app
export const isCapacitor = typeof window !== 'undefined' && 
  (window as any).Capacitor !== undefined;

// Get the base URL for API calls
export function getApiBaseUrl(): string {
  // Reject Replit URLs even if somehow set
  if (API_URL && API_URL.includes('replit.dev')) {
    console.warn('⚠️ Replit URL detected. Using relative paths instead.');
    // In browser/PWA, use relative URLs (same domain)
    if (!isCapacitor) {
      return '';
    }
  }
  
  // If an API URL is configured (from environment variable), use it
  if (API_URL && !API_URL.includes('replit.dev')) {
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
  if (baseUrl && !baseUrl.includes('replit.dev')) {
    return `${baseUrl}${path}`;
  }
  // Always use relative paths to avoid CORS issues
  return path;
}
