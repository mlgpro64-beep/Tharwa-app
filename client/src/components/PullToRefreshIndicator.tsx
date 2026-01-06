import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
    pullDistance: number;
    isRefreshing: boolean;
    isTriggered: boolean;
}

export function PullToRefreshIndicator({
    pullDistance,
    isRefreshing,
    isTriggered,
}: PullToRefreshIndicatorProps) {
    const progress = Math.min(pullDistance / 80, 1);
    const opacity = Math.min(progress * 2, 1);

    return (
        <AnimatePresence>
            {(pullDistance > 0 || isRefreshing) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
                    style={{
                        transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
                    }}
                >
                    <div
                        className="flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-xl bg-background/80 border border-border/50 shadow-lg"
                        style={{ opacity }}
                    >
                        {isRefreshing ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <motion.div
                                animate={{ rotate: isTriggered ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <RefreshCw
                                    className="w-5 h-5 text-primary"
                                    style={{
                                        transform: `rotate(${progress * 360}deg)`,
                                    }}
                                />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
