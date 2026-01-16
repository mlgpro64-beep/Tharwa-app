import { useEffect, useRef, memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMapStyle, createTileLayerConfig } from '@/lib/mapConfig';
import { FullScreenMapModal } from './FullScreenMapModal';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    L: any;
  }
}

interface TaskLocationMapProps {
  latitude: number | string | null;
  longitude: number | string | null;
  location?: string;
  className?: string;
  category?: string;
  showExactLocation?: boolean; // For tasker's active task view
}

// Generate a random offset for privacy (100-200 meters in random direction)
// This is seeded by the coordinates so it's consistent for the same location
function getPrivacyOffset(lat: number, lng: number): { latOffset: number; lngOffset: number } {
  // Create a simple seed from coordinates for consistency
  const seed = Math.abs(lat * 1000 + lng * 1000) % 1000;
  const pseudoRandom1 = Math.sin(seed) * 10000;
  const pseudoRandom2 = Math.cos(seed * 2) * 10000;
  
  // Random angle (0-360 degrees)
  const angle = (pseudoRandom1 - Math.floor(pseudoRandom1)) * 2 * Math.PI;
  
  // Random distance (100-200 meters)
  const distance = 100 + (pseudoRandom2 - Math.floor(pseudoRandom2)) * 100;
  
  // Convert distance to lat/lng offset (approximate)
  // 1 degree latitude ≈ 111,000 meters
  // 1 degree longitude ≈ 111,000 * cos(latitude) meters
  const latOffset = (distance * Math.cos(angle)) / 111000;
  const lngOffset = (distance * Math.sin(angle)) / (111000 * Math.cos(lat * Math.PI / 180));
  
  return { latOffset, lngOffset };
}

const TaskLocationMap = memo(function TaskLocationMap({ 
  latitude, 
  longitude, 
  location,
  className,
  category,
  showExactLocation = false
}: TaskLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { t } = useTranslation();

  const lat = latitude ? parseFloat(String(latitude)) : null;
  const lng = longitude ? parseFloat(String(longitude)) : null;
  const hasCoordinates = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);
  
  // Check if this is an immersive/full-width map (no rounded corners)
  const isImmersive = className?.includes('rounded-none');

  // Calculate privacy offset for circle (memoized for consistency)
  const privacyOffset = useMemo(() => {
    if (!hasCoordinates || !lat || !lng || showExactLocation) {
      return { latOffset: 0, lngOffset: 0 };
    }
    return getPrivacyOffset(lat, lng);
  }, [lat, lng, hasCoordinates, showExactLocation]);

  useEffect(() => {
    if (!mapRef.current || !window.L || !hasCoordinates || !lat || !lng) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const mapStyle = getMapStyle(undefined, true);
    const tileConfig = createTileLayerConfig(mapStyle);

    // Center map on the actual location
    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([lat, lng], 15);

    window.L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);

    // Privacy circle - OFFSET from actual location
    const circleLat = lat + privacyOffset.latOffset;
    const circleLng = lng + privacyOffset.lngOffset;
    
    // Outer glow circle
    window.L.circle([circleLat, circleLng], {
      radius: 180,
      color: 'transparent',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 0
    }).addTo(map);

    // Main privacy circle
    window.L.circle([circleLat, circleLng], {
      radius: 120,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '8, 4'
    }).addTo(map);

    // Modern pulsing dot marker at circle center (NOT exact location)
    const pulsingDotIcon = window.L.divIcon({
      className: 'pulsing-marker',
      html: `
        <div style="position: relative; width: 48px; height: 48px;">
          <!-- Pulsing rings -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.2);
            animation: pulse-ring 2s ease-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            animation: pulse-ring 2s ease-out infinite 0.5s;
          "></div>
          <!-- Center dot -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.9);
          "></div>
        </div>
        <style>
          @keyframes pulse-ring {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        </style>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    window.L.marker([circleLat, circleLng], { icon: pulsingDotIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, hasCoordinates, privacyOffset]);

  if (!hasCoordinates) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "overflow-hidden bg-zinc-900",
          isImmersive ? "" : "rounded-3xl",
          className
        )}
      >
        <div className={cn(
          "h-56 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center",
          isImmersive ? "h-72" : ""
        )}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">
              {t('map.locationNotAvailable')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "overflow-hidden relative group",
        isImmersive ? "" : "rounded-3xl shadow-2xl shadow-black/20",
        className
      )}
      data-testid="task-location-map"
    >
      <div 
        ref={mapRef} 
        className={cn(
          "w-full",
          isImmersive ? "h-72" : "h-56 rounded-3xl"
        )}
        style={{ minHeight: isImmersive ? '288px' : '224px' }}
      />
      
      {/* Only show overlay info if not immersive */}
      {!isImmersive && (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none rounded-b-3xl" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {location || t('map.approximateArea')}
                </p>
                <p className="text-white/60 text-xs">
                  {t('map.tapToViewMap')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      
      <button 
        onClick={() => setIsMapModalOpen(true)}
        className={cn(
          "absolute inset-0 cursor-pointer",
          isImmersive ? "" : "rounded-3xl"
        )}
        aria-label={t('map.openMap')}
      />
      
      {hasCoordinates && lat !== null && lng !== null && (
        <FullScreenMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          latitude={lat}
          longitude={lng}
          location={location}
          showExactLocation={showExactLocation}
        />
      )}
    </motion.div>
  );
});

export default TaskLocationMap;
