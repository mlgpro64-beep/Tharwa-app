import React from 'react';
import { cn } from '../../lib/utils';

interface ScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  safeAreaBottom?: boolean;
  safeAreaTop?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ 
  children, 
  className, 
  safeAreaBottom = true, 
  safeAreaTop = true,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "flex flex-col min-h-screen w-full bg-background-light dark:bg-background-dark",
        safeAreaTop && "pt-[env(safe-area-inset-top)]",
        safeAreaBottom && "pb-[calc(env(safe-area-inset-bottom)+80px)]", // +80px for bottom nav clearance
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};