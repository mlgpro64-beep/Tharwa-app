import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const lat = latitude ? parseFloat(String(latitude)) : null;
  const lng = longitude ? parseFloat(String(longitude)) : null;
  const hasCoordinates = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!mapRef.current || !window.L || !hasCoordinates) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([lat, lng], 18);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    const pulsingIcon = window.L.divIcon({
      className: 'task-location-marker',
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
          <div class="relative w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    window.L.marker([lat, lng], { icon: pulsingIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, hasCoordinates]);

  const openInMaps = () => {
    if (!hasCoordinates) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

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
            <p className="text-sm text-muted-foreground font-medium">Location not available</p>
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
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openInMaps}
        className="absolute top-3 right-3 w-10 h-10 glass flex items-center justify-center rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
        data-testid="button-open-maps"
      >
        <Maximize2 className="w-4 h-4" />
      </motion.button>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 pt-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">
              {location || `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`}
            </p>
            <p className="text-white/70 text-xs">Tap to open in Maps</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={openInMaps}
        className="absolute inset-0 cursor-pointer"
        aria-label="Open location in maps"
      />
    </motion.div>
  );
});

export default TaskLocationMap;
