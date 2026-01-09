// Geolocation Hook for automatic location detection with Riyadh validation
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface GeolocationState {
  coordinates: Coordinates | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  isInRiyadh: boolean;
  isInSupportedCity: boolean;
}

// City boundaries (approximate)
const RIYADH_BOUNDS = {
  north: 25.1,
  south: 24.3,
  east: 47.1,
  west: 46.4,
};

const AL_KHARJ_BOUNDS = {
  north: 24.25,
  south: 24.05,
  east: 47.6,
  west: 47.3,
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    address: null,
    isLoading: false,
    error: null,
    isInRiyadh: false,
    isInSupportedCity: false,
  });
  const { toast } = useToast();

  // Location validation removed - service available in all regions
  const validateRiyadhLocation = useCallback((lat: number, lng: number): boolean => {
    // Always return true - service is available globally
    return true;
  }, []);

  // Location validation removed - service available in all regions
  const validateAlKharjLocation = useCallback((lat: number, lng: number): boolean => {
    // Always return true - service is available globally
    return true;
  }, []);

  // Location validation removed - service available in all regions
  const validateSupportedCityLocation = useCallback((lat: number, lng: number): boolean => {
    // Always return true - service is available globally
    return true;
  }, []);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('الموقع الجغرافي غير مدعوم'));
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          // Location validation removed - always allow access
          const isInRiyadh = true; // Service available in all regions
          const isInSupportedCity = true; // Service available in all regions
          
          setState(prev => ({ 
            ...prev, 
            coordinates: coords, 
            isLoading: false,
            isInRiyadh,
            isInSupportedCity,
          }));
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'فشل في تحديد الموقع';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض إذن الموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'الموقع غير متاح';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة تحديد الموقع';
              break;
          }
          
          setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    });
  }, [validateRiyadhLocation]);

  // Reverse geocode to get address
  const getAddress = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // Using Nominatim OpenStreetMap for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      
      if (!response.ok) throw new Error('Failed to get address');
      
      const data = await response.json();
      
      // Build a readable address
      const parts = [];
      if (data.address?.neighbourhood) parts.push(data.address.neighbourhood);
      if (data.address?.suburb) parts.push(data.address.suburb);
      if (data.address?.city || data.address?.town) parts.push(data.address.city || data.address.town);
      
      const address = parts.length > 0 ? parts.join('، ') : data.display_name?.split(',').slice(0, 3).join('، ');
      
      setState(prev => ({ ...prev, address }));
      return address || 'الرياض';
    } catch (error) {
      console.error('[Geo] Reverse geocode error:', error);
      return 'الرياض';
    }
  }, []);

  // Get current location with address and Riyadh validation
  const getLocationWithAddress = useCallback(async () => {
    try {
      const coords = await getCurrentPosition();
      const address = await getAddress(coords.latitude, coords.longitude);
      
      // Location validation removed - always allow access
      const isInRiyadh = true; // Service available in all regions
      const isInSupportedCity = true; // Service available in all regions
      
      setState(prev => ({ ...prev, isInRiyadh, isInSupportedCity }));
      
      // Location restriction removed - no toast needed
      // if (!isInSupportedCity) {
      //   toast({
      //     title: 'موقع خارج المدن المدعومة',
      //     description: 'الخدمة متاحة حالياً في الرياض والخرج فقط',
      //     variant: 'destructive',
      //   });
      // }
      
      return { ...coords, address, isInRiyadh, isInSupportedCity };
    } catch (error: any) {
      toast({
        title: 'خطأ في تحديد الموقع',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [getCurrentPosition, getAddress, validateRiyadhLocation, validateSupportedCityLocation, toast]);

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  return {
    ...state,
    isSupported,
    getCurrentPosition,
    getAddress,
    getLocationWithAddress,
    validateRiyadhLocation,
    validateSupportedCityLocation,
  };
}
