import { motion, AnimatePresence, Variants } from "framer-motion";
import { forwardRef, memo, ReactNode, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = memo(function PageTransition({ 
  children, 
  className 
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface GlassCardProps extends ComponentPropsWithoutRef<typeof motion.div> {
  variant?: "default" | "premium" | "elevated";
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const GlassCard = memo(forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ variant = "default", children, className, delay = 0, ...props }, ref) {
    const baseClasses = "rounded-3xl p-6 transition-all duration-300";
    
    const variantClasses = {
      default: "glass shadow-lg",
      premium: "glass-premium shadow-xl",
      elevated: "glass shadow-2xl hover:shadow-xl"
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          delay,
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
));

interface AnimatedButtonProps extends ComponentPropsWithoutRef<typeof motion.button> {
  variant?: "primary" | "secondary" | "glass" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export const AnimatedButton = memo(forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  function AnimatedButton({ 
    variant = "primary", 
    size = "default",
    children, 
    className,
    isLoading,
    disabled,
    ...props 
  }, ref) {
    const baseClasses = "relative font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden";
    
    const variantClasses = {
      primary: "gradient-primary text-white shadow-lg shadow-primary/25",
      secondary: "bg-secondary text-secondary-foreground border border-border",
      glass: "glass-button text-foreground",
      ghost: "bg-transparent hover:bg-secondary/50 text-foreground"
    };
    
    const sizeClasses = {
      default: "h-14 px-8 text-base",
      sm: "h-11 px-5 text-sm",
      lg: "h-16 px-10 text-lg",
      icon: "h-12 w-12"
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          baseClasses, 
          variantClasses[variant], 
          sizeClasses[size],
          (disabled || isLoading) && "opacity-60 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          />
        ) : children}
      </motion.button>
    );
  }
));

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const AnimatedList = memo(function AnimatedList({ 
  children, 
  className,
  staggerDelay = 0.05
}: AnimatedListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {children.map((child, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            transition={{ 
              duration: 0.3, 
              delay: index * staggerDelay,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
});

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  animation?: "fadeIn" | "fadeInUp" | "scaleIn" | "slideInRight" | "slideInLeft";
  delay?: number;
  duration?: number;
}

export const AnimatedContainer = memo(function AnimatedContainer({ 
  children, 
  className,
  animation = "fadeInUp",
  delay = 0,
  duration = 0.4
}: AnimatedContainerProps) {
  const animations = {
    fadeIn,
    fadeInUp,
    scaleIn,
    slideInRight,
    slideInLeft
  };

  return (
    <motion.div
      variants={animations[animation]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface FloatingLabelInputProps extends ComponentPropsWithoutRef<"input"> {
  label: string;
  error?: string;
}

export const FloatingLabelInput = memo(forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  function FloatingLabelInput({ label, error, className, ...props }, ref) {
    return (
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          ref={ref}
          placeholder=" "
          className={cn(
            "peer w-full h-16 px-5 pt-5 rounded-2xl glass-input text-foreground placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200",
            error && "border-destructive focus:ring-destructive/30",
            className
          )}
          {...props}
        />
        <label className="absolute left-5 top-2 text-xs font-medium text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary">
          {label}
        </label>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
));

interface SkeletonProps {
  className?: string;
}

export const Skeleton = memo(function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-2xl shimmer", className)} />
  );
});

interface TaskCardSkeletonProps {
  count?: number;
}

export const TaskCardSkeleton = memo(function TaskCardSkeleton({ count = 3 }: TaskCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
});

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = memo(function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/25"
      >
        <div className="text-white">{icon}</div>
      </motion.div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-xs mb-6">{description}</p>
      {action}
    </motion.div>
  );
});

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const LoadingSpinner = memo(function LoadingSpinner({ 
  size = "default",
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    default: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3"
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        sizeClasses[size],
        "border-primary border-t-transparent rounded-full",
        className
      )}
    />
  );
});

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader = memo(function FullPageLoader({ 
  message = "Loading..." 
}: FullPageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    >
      <LoadingSpinner size="lg" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-muted-foreground"
      >
        {message}
      </motion.p>
    </motion.div>
  );
});

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export const PullToRefresh = memo(function PullToRefresh({
  onRefresh,
  children
}: PullToRefreshProps) {
  return (
    <div className="relative">
      {children}
    </div>
  );
});

export { AnimatePresence };
