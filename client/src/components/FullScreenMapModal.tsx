import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMapStyle, createTileLayerConfig, createMarkerIcon } from '@/lib/mapConfig';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    L: any;
  }
}

interface FullScreenMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  location?: string;
}

export function FullScreenMapModal({
  isOpen,
  onClose,
  latitude,
  longitude,
  location,
}: FullScreenMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!isOpen || !mapRef.current || !window.L) return;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const mapStyle = getMapStyle(undefined, isDarkMode);
    const tileConfig = createTileLayerConfig(mapStyle);

    // Create map with all interactions enabled
    const map = window.L.map(mapRef.current, {
      zoomControl: false, // Disable default zoom control to avoid duplicates
      attributionControl: true,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
    }).setView([latitude, longitude], 15);

    window.L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);

    // Add single zoom control
    window.L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Create transparent blue circle with 100 meter radius
    window.L.circle([latitude, longitude], {
      radius: 100, // 100 meters
      color: '#3b82f6', // blue color
      fillColor: '#3b82f6',
      fillOpacity: 0.2, // transparent
      weight: 2
    }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size after a short delay to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative h-16 flex items-center justify-between px-4 bg-black/50 backdrop-blur-sm">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors",
                  isRTL && "order-first"
                )}
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* Map Container */}
            <div 
              ref={mapRef} 
              className="flex-1 w-full"
              style={{ minHeight: 0 }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}













