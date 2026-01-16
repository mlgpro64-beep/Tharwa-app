import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMapStyle, createTileLayerConfig } from '@/lib/mapConfig';
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
  showExactLocation?: boolean;
}

// Generate a random offset for privacy (100-200 meters in random direction)
function getPrivacyOffset(lat: number, lng: number): { latOffset: number; lngOffset: number } {
  const seed = Math.abs(lat * 1000 + lng * 1000) % 1000;
  const pseudoRandom1 = Math.sin(seed) * 10000;
  const pseudoRandom2 = Math.cos(seed * 2) * 10000;
  
  const angle = (pseudoRandom1 - Math.floor(pseudoRandom1)) * 2 * Math.PI;
  const distance = 100 + (pseudoRandom2 - Math.floor(pseudoRandom2)) * 100;
  
  const latOffset = (distance * Math.cos(angle)) / 111000;
  const lngOffset = (distance * Math.sin(angle)) / (111000 * Math.cos(lat * Math.PI / 180));
  
  return { latOffset, lngOffset };
}

export function FullScreenMapModal({
  isOpen,
  onClose,
  latitude,
  longitude,
  location,
  showExactLocation = false,
}: FullScreenMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // Calculate privacy offset
  const privacyOffset = useMemo(() => {
    if (showExactLocation) {
      return { latOffset: 0, lngOffset: 0 };
    }
    return getPrivacyOffset(latitude, longitude);
  }, [latitude, longitude, showExactLocation]);

  // Open external navigation (uses approximate area, not exact)
  const openNavigation = () => {
    const navLat = showExactLocation ? latitude : latitude + privacyOffset.latOffset;
    const navLng = showExactLocation ? longitude : longitude + privacyOffset.lngOffset;
    const destination = `${navLat},${navLng}`;
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      window.open(`maps://maps.apple.com/?daddr=${destination}&dirflg=d`, '_blank');
    } else if (/android/.test(userAgent)) {
      window.open(`google.navigation:q=${destination}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
    }
  };

  useEffect(() => {
    if (!isOpen || !mapRef.current || !window.L) return;

    const mapStyle = getMapStyle(undefined, true);
    const tileConfig = createTileLayerConfig(mapStyle);

    // Center on the display location (offset for privacy unless exact)
    const displayLat = showExactLocation ? latitude : latitude + privacyOffset.latOffset;
    const displayLng = showExactLocation ? longitude : longitude + privacyOffset.lngOffset;

    const map = window.L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
    }).setView([displayLat, displayLng], 16);

    window.L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);

    // Add zoom control
    window.L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    if (showExactLocation) {
      // For exact location (tasker view) - show precise pin
      const exactPinIcon = window.L.divIcon({
        className: 'exact-location-marker',
        html: `
          <div style="position: relative; width: 56px; height: 56px;">
            <!-- Modern pin shape -->
            <div style="
              position: absolute;
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 44px;
              height: 44px;
              background: white;
              border-radius: 50% 50% 50% 0;
              transform: translateX(-50%) rotate(-45deg);
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
            <!-- Shadow dot -->
            <div style="
              position: absolute;
              bottom: 2px;
              left: 50%;
              transform: translateX(-50%);
              width: 12px;
              height: 4px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 50%;
              filter: blur(2px);
            "></div>
          </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 52],
      });

      window.L.marker([latitude, longitude], { icon: exactPinIcon }).addTo(map);
    } else {
      // Privacy view - show pulsing area indicator
      
      // Outer glow
      window.L.circle([displayLat, displayLng], {
        radius: 180,
        color: 'transparent',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 0
      }).addTo(map);

      // Main privacy circle
      window.L.circle([displayLat, displayLng], {
        radius: 120,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '8, 4'
      }).addTo(map);

      // Modern area indicator
      const areaIndicatorIcon = window.L.divIcon({
        className: 'area-indicator-marker',
        html: `
          <div style="position: relative; width: 64px; height: 64px;">
            <!-- Pulsing rings -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 64px;
              height: 64px;
              border-radius: 50%;
              border: 2px solid rgba(59, 130, 246, 0.3);
              animation: pulse-expand 2.5s ease-out infinite;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 48px;
              height: 48px;
              border-radius: 50%;
              border: 2px solid rgba(59, 130, 246, 0.4);
              animation: pulse-expand 2.5s ease-out infinite 0.8s;
            "></div>
            <!-- Center badge -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
              "></div>
            </div>
          </div>
          <style>
            @keyframes pulse-expand {
              0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
            }
          </style>
        `,
        iconSize: [64, 64],
        iconAnchor: [32, 32],
      });

      window.L.marker([displayLat, displayLng], { icon: areaIndicatorIcon }).addTo(map);
    }

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude, privacyOffset, showExactLocation]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-[#0a0a0b]"
          style={{ zIndex: 9999 }}
        >
          {/* Map Container */}
          <div 
            ref={mapRef} 
            className="absolute inset-0 w-full h-full"
          />

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className={cn(
              "absolute w-12 h-12 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-xl border border-white/20 transition-transform active:scale-95 shadow-2xl",
              isArabic ? "right-4" : "left-4"
            )}
            style={{ 
              zIndex: 10000,
              top: 'max(16px, env(safe-area-inset-top, 16px))'
            }}
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Privacy Notice Badge (when not showing exact location) */}
          {!showExactLocation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.2 }}
              className="absolute right-4"
              style={{ 
                zIndex: 10000,
                top: 'max(16px, env(safe-area-inset-top, 16px))'
              }}
            >
              <div className="bg-blue-500/20 backdrop-blur-xl rounded-full px-3 py-2 border border-blue-500/30 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-blue-300">
                  {isArabic ? 'المنطقة التقريبية' : 'Approximate Area'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Location Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.15 }}
            className="absolute left-4 right-4"
            style={{ 
              zIndex: 10000,
              bottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
            }}
          >
            <div className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800/50 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {location || (isArabic ? 'موقع المهمة' : 'Task Location')}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    {showExactLocation 
                      ? (isArabic ? 'الموقع الدقيق' : 'Exact location')
                      : (isArabic ? 'المنطقة التقريبية' : 'Approximate area')
                    }
                  </p>
                </div>
                <button
                  onClick={openNavigation}
                  className="h-10 px-4 rounded-xl bg-white text-black font-medium text-sm flex items-center gap-2 transition-transform active:scale-95"
                >
                  <span>{isArabic ? 'ابدأ' : 'Go'}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
