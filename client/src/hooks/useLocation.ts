import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  isInRiyadh: boolean | null;
  isLoading: boolean;
  error: string | null;
  checkLocation: () => void;
  isTestMode: boolean;
}

const TESTING_KEY = 'tharwa_dev_mode';

const RIYADH_BOUNDS = {
  minLat: 24.3,
  maxLat: 25.1,
  minLon: 46.4,
  maxLon: 47.1,
};

const AL_KHARJ_BOUNDS = {
  minLat: 24.05,
  maxLat: 24.25,
  minLon: 47.3,
  maxLon: 47.6,
};

// Location validation removed - service available in all regions
const isWithinRiyadh = (lat: number, lon: number): boolean => {
  // Always return true - service is available globally
  return true;
};

const isWithinAlKharj = (lat: number, lon: number): boolean => {
  // Always return true - service is available globally
  return true;
};

const isWithinSupportedCity = (lat: number, lon: number): boolean => {
  // Always return true - service is available globally
  return true;
};

const checkTestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === 'true') {
    localStorage.setItem(TESTING_KEY, 'true');
    return true;
  }
  
  return localStorage.getItem(TESTING_KEY) === 'true';
};

export function useLocation(): LocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isTestMode] = useState<boolean>(() => checkTestMode());
  const [isInRiyadh, setIsInRiyadh] = useState<boolean | null>(() => {
    if (checkTestMode()) return true;
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isInRiyadh');
      if (saved !== null) return saved === 'true';
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setIsInRiyadh(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        
        // Location validation removed - always allow access
        const inRiyadh = true; // Service available in all regions
        setIsInRiyadh(inRiyadh);
        localStorage.setItem('isInRiyadh', String(inRiyadh));
        localStorage.setItem('userLatitude', String(lat));
        localStorage.setItem('userLongitude', String(lon));
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsInRiyadh(true);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLat = localStorage.getItem('userLatitude');
      const savedLon = localStorage.getItem('userLongitude');
      if (savedLat && savedLon) {
        setLatitude(parseFloat(savedLat));
        setLongitude(parseFloat(savedLon));
      }
    }
  }, []);

  return {
    latitude,
    longitude,
    isInRiyadh: true, // Service available in all regions - always allow access
    isLoading,
    error,
    checkLocation,
    isTestMode,
  };
}
