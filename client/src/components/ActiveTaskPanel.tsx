import { memo, useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, Phone, MessageCircle, Clock,
    CheckCircle, ChevronUp, ExternalLink, Route, Star, Wallet, Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';
import { getMapStyle, createTileLayerConfig } from '@/lib/mapConfig';

declare global {
    interface Window {
        L: any;
    }
}

interface ActiveTaskPanelProps {
    task: {
        id: string;
        title: string;
        description?: string;
        location?: string;
        latitude?: number | string | null;
        longitude?: number | string | null;
        budget?: number | string;
        date?: string;
        time?: string;
        status: string;
        client?: {
            id: string;
            name?: string;
            phone?: string;
            avatar?: string;
            rating?: number | string;
        };
    };
    onRequestCompletion?: () => void;
    isRequestingCompletion?: boolean;
}

export const ActiveTaskPanel = memo(function ActiveTaskPanel({
    task,
    onRequestCompletion,
    isRequestingCompletion = false
}: ActiveTaskPanelProps) {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [isExpanded, setIsExpanded] = useState(true);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    const lat = task.latitude ? parseFloat(String(task.latitude)) : null;
    const lng = task.longitude ? parseFloat(String(task.longitude)) : null;
    const hasCoordinates = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || !window.L || !hasCoordinates || !isExpanded) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const mapStyle = getMapStyle(undefined, true);
        const tileConfig = createTileLayerConfig(mapStyle);

        const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([lat, lng], 15);

        window.L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);

        // Modern exact location marker for assigned tasker
        const exactPinIcon = window.L.divIcon({
            className: 'exact-location-marker',
            html: `
                <div style="position: relative; width: 52px; height: 52px;">
                    <!-- Modern pin with white background -->
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 40px;
                        height: 40px;
                        background: white;
                        border-radius: 50% 50% 50% 0;
                        transform: translateX(-50%) rotate(-45deg);
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                    ">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(45deg);
                            width: 22px;
                            height: 22px;
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </div>
                    </div>
                    <!-- Shadow -->
                    <div style="
                        position: absolute;
                        bottom: 4px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 10px;
                        height: 4px;
                        background: rgba(0, 0, 0, 0.15);
                        border-radius: 50%;
                        filter: blur(2px);
                    "></div>
                </div>
            `,
            iconSize: [52, 52],
            iconAnchor: [26, 48],
        });

        window.L.marker([lat, lng], { icon: exactPinIcon }).addTo(map);

        // Small indicator circle around exact location
        window.L.circle([lat, lng], {
            radius: 30,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 2,
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, hasCoordinates, isExpanded]);

    const openNavigation = () => {
        if (!hasCoordinates) return;
        const destination = `${lat},${lng}`;
        const userAgent = navigator.userAgent.toLowerCase();

        if (/iphone|ipad|ipod/.test(userAgent)) {
            window.open(`maps://maps.apple.com/?daddr=${destination}&dirflg=d`, '_blank');
        } else if (/android/.test(userAgent)) {
            window.open(`google.navigation:q=${destination}`, '_blank');
        } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl overflow-hidden bg-zinc-900/50"
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-blue-500/10"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Route className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-white text-sm">
                            {isArabic ? 'المهمة النشطة' : 'Active Task'}
                        </h3>
                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {task.title}
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronUp className="w-5 h-5 text-zinc-500" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Map */}
                        {hasCoordinates && (
                            <div className="relative">
                                <div
                                    ref={mapRef}
                                    className="h-40 w-full"
                                    style={{ minHeight: '160px' }}
                                />
                                
                                {/* Navigation Button */}
                                <button
                                    onClick={openNavigation}
                                    className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl text-sm font-medium transition-transform active:scale-95"
                                >
                                    <Navigation className="w-4 h-4" />
                                    <span>{isArabic ? 'ابدأ' : 'Navigate'}</span>
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                </button>

                                {/* Location Badge */}
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 max-w-[160px]">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 text-white flex-shrink-0" />
                                        <p className="text-white text-xs font-medium truncate">
                                            {task.location || `${lat?.toFixed(3)}, ${lng?.toFixed(3)}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Info */}
                        {task.client && (
                            <div className="p-4 border-t border-zinc-800/50">
                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide mb-3">
                                    {isArabic ? 'العميل' : 'Client'}
                                </p>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar className="w-10 h-10 ring-2 ring-zinc-800">
                                        <AvatarImage src={task.client.avatar || undefined} />
                                        <AvatarFallback className="bg-zinc-800 text-white font-semibold text-sm">
                                            {task.client.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{task.client.name}</p>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            <span className="text-xs text-zinc-500">
                                                {parseFloat(String(task.client.rating || 0)).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2">
                                        {task.client.phone && (
                                            <a
                                                href={`tel:${task.client.phone}`}
                                                className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center"
                                            >
                                                <Phone className="w-4 h-4 text-emerald-400" />
                                            </a>
                                        )}
                                        <Link href={`/chat/${task.id}`}>
                                            <button className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Task Details */}
                        <div className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="p-3 rounded-xl bg-zinc-800/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Wallet className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                                            {isArabic ? 'الميزانية' : 'Budget'}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-white text-sm">
                                        {formatCurrency(task.budget, { locale: isArabic ? 'ar' : 'en' })}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-800/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                                            {isArabic ? 'الموعد' : 'Schedule'}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-white text-sm">
                                        {task.date || (isArabic ? 'مرن' : 'Flexible')}
                                    </p>
                                </div>
                            </div>

                            {/* Completion Button */}
                            {task.status === 'assigned' && onRequestCompletion && (
                                <button
                                    onClick={onRequestCompletion}
                                    disabled={isRequestingCompletion}
                                    className="w-full h-12 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isRequestingCompletion ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            <span>{isArabic ? 'جاري الإرسال...' : 'Sending...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>{isArabic ? 'تم إنجاز المهمة' : 'Mark as Complete'}</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Waiting State */}
                            {task.status === 'in_progress' && (
                                <div className="h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-medium text-amber-400">
                                        {isArabic ? 'في انتظار الدفع' : 'Awaiting Payment'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default ActiveTaskPanel;
