import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * Lazy-loaded image component with blur placeholder
 */
export function LazyImage({
    src,
    alt,
    className,
    placeholderClassName,
    onLoad,
    onError,
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '50px' }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        onError?.();
    };

    return (
        <div className={cn('relative overflow-hidden bg-muted', className)}>
            {/* Placeholder */}
            {!isLoaded && (
                <div
                    className={cn(
                        'absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10',
                        placeholderClassName
                    )}
                />
            )}

            {/* Actual Image */}
            <img
                ref={imgRef}
                src={isVisible ? src : undefined}
                alt={alt}
                className={cn(
                    'transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                    className
                )}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
}
