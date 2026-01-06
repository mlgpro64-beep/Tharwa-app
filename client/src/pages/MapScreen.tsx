import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { LoadingSpinner } from '@/components/ui/animated';
import { ArrowLeft, Search, List, MapPin, Clock, X, Wallet } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';
import { getMapStyle, createTileLayerConfig, createMarkerIcon } from '@/lib/mapConfig';

declare global {
  interface Window {
    L: any;
  }
}

const MapScreen = memo(function MapScreen() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);

  const { data: tasks, isLoading, error } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available'],
  });

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    const defaultCenter: [number, number] = [40.7128, -74.0060];

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const mapStyle = getMapStyle(undefined, isDarkMode);
    const tileConfig = createTileLayerConfig(mapStyle);

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
      }).setView(defaultCenter, 15);

      window.L.tileLayer(tileConfig.url, tileConfig.options).addTo(mapInstanceRef.current);

      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !tasks || !window.L) return;

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    tasks.forEach((task) => {
      const lat = task.latitude ? parseFloat(String(task.latitude)) : 40.7128 + (Math.random() - 0.5) * 0.05;
      const lng = task.longitude ? parseFloat(String(task.longitude)) : -74.0060 + (Math.random() - 0.5) * 0.05;

      // Use enhanced marker icon from mapConfig
      const customIcon = createMarkerIcon(
        window.L,
        {
          size: 24,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: 'custom-marker',
        },
        false, // No pulse for task markers
        'primary'
      );

      const marker = window.L.marker([lat, lng], { icon: customIcon })
        .addTo(mapInstanceRef.current);

      marker.on('click', () => {
        setSelectedTask(task);
      });
    });
  }, [tasks]);


  return (
    <div className="min-h-screen relative bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe flex items-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.history.back()}
          className="w-11 h-11 flex items-center justify-center rounded-2xl glass shadow-lg"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search location..."
              className="w-full h-11 pl-12 pr-4 rounded-2xl glass text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-lg"
              data-testid="input-search-location"
            />
          </div>
        </div>

        <Link href="/tasks-feed">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass shadow-lg"
            data-testid="button-list-view"
          >
            <List className="w-5 h-5" />
          </motion.button>
        </Link>
      </motion.div>

      {isLoading || error ? (
        <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-primary/5">
          <div className="text-center">
            {isLoading ? (
              <>
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Loading map...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Map unavailable</h3>
                <p className="text-muted-foreground text-sm">Please try again later</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="h-screen w-full" />
      )}

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-safe"
          >
            <Link href={`/task/${selectedTask.id}`}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="glass-premium p-5 rounded-3xl shadow-2xl cursor-pointer"
                data-testid={`task-preview-${selectedTask.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {selectedTask.category}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{selectedTask.title}</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedTask(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full glass-button"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{selectedTask.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {selectedTask.distance || selectedTask.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {selectedTask.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-primary/15 px-3 py-1.5 rounded-xl">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="font-extrabold text-lg text-primary">
                      {formatCurrency(selectedTask.budget, { locale: 'en' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MapScreen;
