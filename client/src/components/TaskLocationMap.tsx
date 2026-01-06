import { useEffect, useRef, memo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMapStyle, createTileLayerConfig, createMarkerIcon } from '@/lib/mapConfig';
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
}

const TaskLocationMap = memo(function TaskLocationMap({ 
  latitude, 
  longitude, 
  location,
  className 
}: TaskLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const lat = latitude ? parseFloat(String(latitude)) : null;
  const lng = longitude ? parseFloat(String(longitude)) : null;
  const hasCoordinates = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!mapRef.current || !window.L || !hasCoordinates) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const mapStyle = getMapStyle(undefined, isDarkMode);
    const tileConfig = createTileLayerConfig(mapStyle);

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

    // Create transparent blue circle with 100 meter radius
    window.L.circle([lat, lng], {
      radius: 100, // 100 meters
      color: '#3b82f6', // blue color
      fillColor: '#3b82f6',
      fillOpacity: 0.2, // transparent
      weight: 2
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, hasCoordinates]);

  if (!hasCoordinates) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "glass rounded-3xl overflow-hidden",
          className
        )}
      >
        <div className="h-48 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {t('map.locationNotAvailable')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-3xl overflow-hidden relative group",
        className
      )}
      data-testid="task-location-map"
    >
      <div 
        ref={mapRef} 
        className="h-48 w-full"
        style={{ minHeight: '192px' }}
      />
      
      <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/10" />
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">
              {location || `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`}
            </p>
            <p className="text-white/70 text-xs">
              {t('map.tapToViewMap')}
            </p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setIsMapModalOpen(true)}
        className="absolute inset-0 cursor-pointer"
        aria-label={t('map.openMap')}
      />
      
      {hasCoordinates && lat !== null && lng !== null && (
        <FullScreenMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          latitude={lat}
          longitude={lng}
          location={location}
        />
      )}
    </motion.div>
  );
});

export default TaskLocationMap;
