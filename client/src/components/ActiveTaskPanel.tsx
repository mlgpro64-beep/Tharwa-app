import { memo, useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, Phone, MessageCircle, Clock,
    CheckCircle, User, ChevronUp, ChevronDown, ExternalLink,
    Route, Star, Wallet, Calendar, Copy, Check
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
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
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const isArabic = i18n.language === 'ar';
    const [isExpanded, setIsExpanded] = useState(true);
    const [phoneCopied, setPhoneCopied] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    const lat = task.latitude ? parseFloat(String(task.latitude)) : null;
    const lng = task.longitude ? parseFloat(String(task.longitude)) : null;
    const hasCoordinates = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || !window.L || !hasCoordinates || !isExpanded) return;

        // Cleanup existing map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const isDarkMode = document.documentElement.classList.contains('dark');
        const mapStyle = getMapStyle(undefined, isDarkMode);
        const tileConfig = createTileLayerConfig(mapStyle);

        const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([lat, lng], 15);

        window.L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);

        // Custom marker icon
        const customIcon = window.L.divIcon({
            className: 'custom-marker',
            html: `
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          border: 3px solid white;
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 20px;">📍</div>
        </div>
      `,
            iconSize: [48, 48],
            iconAnchor: [24, 48],
        });

        window.L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Pulsing circle around marker
        window.L.circle([lat, lng], {
            radius: 150,
            color: '#6366F1',
            fillColor: '#6366F1',
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

    // Open navigation in external app
    const openNavigation = () => {
        if (!hasCoordinates) return;

        const destination = `${lat},${lng}`;
        const label = encodeURIComponent(task.location || task.title);

        // Try to detect platform and open appropriate navigation
        const userAgent = navigator.userAgent.toLowerCase();

        if (/iphone|ipad|ipod/.test(userAgent)) {
            // iOS - Apple Maps
            window.open(`maps://maps.apple.com/?daddr=${destination}&dirflg=d`, '_blank');
        } else if (/android/.test(userAgent)) {
            // Android - Google Maps
            window.open(`google.navigation:q=${destination}`, '_blank');
        } else {
            // Fallback to Google Maps web
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
        }
    };

    // Copy phone number
    const copyPhone = async () => {
        if (!task.client?.phone) return;

        try {
            await navigator.clipboard.writeText(task.client.phone);
            setPhoneCopied(true);
            toast({
                title: isArabic ? 'تم النسخ' : 'Copied',
                description: isArabic ? 'تم نسخ رقم الجوال' : 'Phone number copied',
            });
            setTimeout(() => setPhoneCopied(false), 2000);
        } catch {
            toast({
                title: isArabic ? 'خطأ' : 'Error',
                description: isArabic ? 'فشل نسخ الرقم' : 'Failed to copy',
                variant: 'destructive',
            });
        }
    };

    // Call client
    const callClient = () => {
        if (!task.client?.phone) return;
        window.open(`tel:${task.client.phone}`, '_self');
    };

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-premium rounded-3xl overflow-hidden border border-white/10"
        >
            {/* Header with toggle */}
            <motion.div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-primary/10 to-accent/10"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                        <Route className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">
                            {isArabic ? 'المهمة النشطة' : 'Active Task'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {task.title}
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Map Section */}
                        {hasCoordinates && (
                            <div className="relative">
                                <div
                                    ref={mapRef}
                                    className="h-48 w-full"
                                    style={{ minHeight: '192px' }}
                                />

                                {/* Navigation Button Overlay */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={openNavigation}
                                    className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-bold shadow-xl shadow-primary/30"
                                >
                                    <Navigation className="w-5 h-5" />
                                    <span>{isArabic ? 'ابدأ الملاحة' : 'Start Navigation'}</span>
                                    <ExternalLink className="w-4 h-4 opacity-70" />
                                </motion.button>

                                {/* Location Info */}
                                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md rounded-xl px-3 py-2 max-w-[180px]">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-white" />
                                        <p className="text-white text-xs font-medium truncate">
                                            {task.location || `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Info Section */}
                        {task.client && (
                            <div className="p-4 border-t border-white/5">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    {isArabic ? 'معلومات العميل' : 'Client Information'}
                                </p>

                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-lg">
                                        <AvatarImage src={task.client.avatar || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                                            {task.client.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground text-lg truncate">{task.client.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {parseFloat(String(task.client.rating || 0)).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Call Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={callClient}
                                        disabled={!task.client.phone}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                                            <Phone className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                            {isArabic ? 'اتصال' : 'Call'}
                                        </span>
                                    </motion.button>

                                    {/* Chat Button */}
                                    <Link href={`/chat/${task.id}`}>
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors w-full"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                                                <MessageCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-primary">
                                                {isArabic ? 'محادثة' : 'Chat'}
                                            </span>
                                        </motion.button>
                                    </Link>

                                    {/* Copy Phone Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={copyPhone}
                                        disabled={!task.client.phone}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                            {phoneCopied ? (
                                                <Check className="w-6 h-6 text-white" />
                                            ) : (
                                                <Copy className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {phoneCopied
                                                ? (isArabic ? 'تم النسخ' : 'Copied')
                                                : (isArabic ? 'نسخ الرقم' : 'Copy #')
                                            }
                                        </span>
                                    </motion.button>
                                </div>

                                {/* Phone Number Display */}
                                {task.client.phone && (
                                    <div className="mt-4 p-3 rounded-2xl bg-muted/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-mono font-medium text-foreground" dir="ltr">
                                                {task.client.phone}
                                            </span>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={copyPhone}
                                            className="text-primary"
                                        >
                                            {phoneCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Task Details */}
                        <div className="p-4 border-t border-white/5">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-2xl bg-muted/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet className="w-4 h-4 text-primary" />
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {isArabic ? 'الميزانية' : 'Budget'}
                                        </span>
                                    </div>
                                    <p className="font-bold text-foreground">
                                        {formatCurrency(task.budget, { locale: isArabic ? 'ar' : 'en' })}
                                    </p>
                                </div>
                                <div className="p-3 rounded-2xl bg-muted/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4 text-accent" />
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {isArabic ? 'الموعد' : 'Schedule'}
                                        </span>
                                    </div>
                                    <p className="font-bold text-foreground text-sm">
                                        {task.date || (isArabic ? 'غير محدد' : 'Not set')}
                                    </p>
                                    {task.time && (
                                        <p className="text-xs text-muted-foreground">{task.time}</p>
                                    )}
                                </div>
                            </div>

                            {/* Complete Task Button */}
                            {task.status === 'assigned' && onRequestCompletion && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onRequestCompletion}
                                    disabled={isRequestingCompletion}
                                    className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-green-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isRequestingCompletion ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            <span>{isArabic ? 'جاري الإرسال...' : 'Sending...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>{isArabic ? 'تم إنجاز المهمة' : 'Task Completed'}</span>
                                        </>
                                    )}
                                </motion.button>
                            )}

                            {/* Waiting for payment state */}
                            {task.status === 'in_progress' && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-600 dark:text-amber-400">
                                                {isArabic ? 'في انتظار الدفع' : 'Awaiting Payment'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isArabic ? 'العميل سيقوم بالدفع لإتمام المهمة' : 'Client will complete payment'}
                                            </p>
                                        </div>
                                    </div>
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
