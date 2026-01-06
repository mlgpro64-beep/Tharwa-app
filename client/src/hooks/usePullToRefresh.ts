import { useState, useEffect, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    resistance?: number;
}

export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    resistance = 2.5,
}: PullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const container = containerRef.current;
        if (!container) return;

        // Only trigger if scrolled to top
        if (container.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
        }
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (startY.current === 0) return;
        if (isRefreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            startY.current = 0;
            setPullDistance(0);
            return;
        }

        currentY.current = e.touches[0].clientY;
        const distance = currentY.current - startY.current;

        if (distance > 0) {
            // Prevent default scrolling when pulling down
            e.preventDefault();

            // Apply resistance
            const adjustedDistance = distance / resistance;
            setPullDistance(Math.min(adjustedDistance, threshold * 1.5));
        }
    }, [isRefreshing, threshold, resistance]);

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold);

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }

        startY.current = 0;
        currentY.current = 0;
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return {
        containerRef,
        pullDistance,
        isRefreshing,
        isTriggered: pullDistance >= threshold,
    };
}
