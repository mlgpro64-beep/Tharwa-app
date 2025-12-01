import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  isInRiyadh: boolean | null;
  isLoading: boolean;
  error: string | null;
  checkLocation: () => void;
}

const RIYADH_BOUNDS = {
  minLat: 24.4,
  maxLat: 25.1,
  minLon: 46.3,
  maxLon: 47.1,
};

const isWithinRiyadh = (lat: number, lon: number): boolean => {
  return (
    lat >= RIYADH_BOUNDS.minLat &&
    lat <= RIYADH_BOUNDS.maxLat &&
    lon >= RIYADH_BOUNDS.minLon &&
    lon <= RIYADH_BOUNDS.maxLon
  );
};

export function useLocation(): LocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isInRiyadh, setIsInRiyadh] = useState<boolean | null>(() => {
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
        
        const inRiyadh = isWithinRiyadh(lat, lon);
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
    isInRiyadh,
    isLoading,
    error,
    checkLocation,
  };
}
