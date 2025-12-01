import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TaskWithDetails } from '@shared/schema';

declare global {
  interface Window {
    L: any;
  }
}

export default function MapScreen() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);

  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available'],
  });

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    const defaultCenter: [number, number] = [40.7128, -74.0060];
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
      }).setView(defaultCenter, 13);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

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

    tasks.forEach((task, index) => {
      const lat = task.latitude ? parseFloat(String(task.latitude)) : 40.7128 + (Math.random() - 0.5) * 0.05;
      const lng = task.longitude ? parseFloat(String(task.longitude)) : -74.0060 + (Math.random() - 0.5) * 0.05;
      
      const customIcon = window.L.divIcon({
        className: 'custom-marker',
        html: `<div class="custom-marker-pin"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = window.L.marker([lat, lng], { icon: customIcon })
        .addTo(mapInstanceRef.current);

      marker.on('click', () => {
        setSelectedTask(task);
      });
    });
  }, [tasks]);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Screen className="px-0 relative" safeAreaBottom={false} noPadding>
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-xl border border-border shadow-lg hover:bg-card transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
            <input
              type="search"
              placeholder="Search location..."
              className="w-full h-10 pl-12 pr-4 rounded-full bg-card/90 backdrop-blur-xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-lg"
              data-testid="input-search-location"
            />
          </div>
        </div>
        <Link href="/tasks-feed">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card/90 backdrop-blur-xl border border-border shadow-lg hover:bg-card transition-colors active:scale-90"
            data-testid="button-list-view"
          >
            <span className="material-symbols-outlined">list</span>
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="h-screen flex items-center justify-center bg-muted">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading map...</p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="h-screen w-full" />
      )}

      {selectedTask && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-safe animate-slide-up">
          <Link href={`/task/${selectedTask.id}`}>
            <div 
              className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-xl active:scale-[0.99] transition-all cursor-pointer"
              data-testid={`task-preview-${selectedTask.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {selectedTask.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{selectedTask.title}</h3>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedTask(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{selectedTask.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                    {selectedTask.distance || selectedTask.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    {selectedTask.time}
                  </div>
                </div>
                <span className="font-extrabold text-lg text-primary">
                  {formatCurrency(selectedTask.budget)}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </Screen>
  );
}
