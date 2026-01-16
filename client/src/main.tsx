import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./index.css";

// Global error handler for dynamic import failures
window.addEventListener('error', (event) => {
  const error = event.error || event.message;
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  
  // Check if it's a dynamic import error
  if (errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('dynamically imported module')) {
    
    console.warn('Dynamic import error detected, clearing cache and reloading...');
    event.preventDefault(); // Prevent default error handling
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        Promise.all(names.map(name => caches.delete(name)))
          .then(() => {
            console.log('All caches cleared');
          });
      });
    }
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        Promise.all(registrations.map(reg => reg.unregister()))
          .then(() => {
            console.log('All service workers unregistered');
          });
      });
    }
    
    // Clear localStorage flag to ensure fresh start
    try {
      localStorage.removeItem('app-version');
      localStorage.removeItem('build-id');
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Force reload after clearing
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
});

// Handle unhandled promise rejections (async module loading errors)
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  
  if (errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('dynamically imported module')) {
    
    console.warn('Async dynamic import error detected, clearing cache and reloading...');
    event.preventDefault();
    
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        Promise.all(names.map(name => caches.delete(name)))
          .then(() => setTimeout(() => window.location.reload(), 500));
      });
    } else {
      setTimeout(() => window.location.reload(), 500);
    }
  }
});

// Ensure React is available before rendering
if (typeof React === 'undefined') {
  throw new Error('React is not properly loaded. Please check your dependencies.');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your HTML.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
