import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  safeAreaBottom?: boolean;
  safeAreaTop?: boolean;
  noPadding?: boolean;
}

export function Screen({ 
  children, 
  className, 
  safeAreaBottom = true, 
  safeAreaTop = true,
  noPadding = false,
  ...props 
}: ScreenProps) {
  return (
    <div 
      className={cn(
        "flex flex-col min-h-screen w-full bg-background",
        safeAreaTop && "pt-safe",
        safeAreaBottom && "pb-[calc(env(safe-area-inset-bottom)+80px)]",
        !noPadding && "px-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
