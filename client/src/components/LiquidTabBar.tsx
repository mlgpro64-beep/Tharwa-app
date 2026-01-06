import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Home, Wallet, ListTodo, User } from 'lucide-react';

interface NavItem {
  icon: typeof Home;
  labelKey: string;
  path: string;
}

export const LiquidTabBar = memo(function LiquidTabBar() {
  const [location] = useLocation();
  const { userRole } = useApp();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const isActive = useCallback((path: string) => {
    if (path === '/home') return location === '/home' || location === '/';
    return location === path || location.startsWith(path + '/');
  }, [location]);

  // Navigation items: الرئيسية، المحفظة، المهام، الملف
  const navItems: NavItem[] = useMemo(() => 
    userRole === 'tasker' 
      ? [
          { icon: Home, labelKey: 'nav.home', path: '/home' },
          { icon: Wallet, labelKey: 'wallet.title', path: '/wallet' },
          { icon: ListTodo, labelKey: 'nav.tasks', path: '/tasks-feed' },
          { icon: User, labelKey: 'nav.profile', path: '/profile' },
        ]
      : [
          { icon: Home, labelKey: 'nav.home', path: '/home' },
          { icon: Wallet, labelKey: 'wallet.title', path: '/wallet' },
          { icon: ListTodo, labelKey: 'tasks.myTasks', path: '/my-tasks' },
          { icon: User, labelKey: 'nav.profile', path: '/profile' },
        ],
    [userRole]
  );

  const hiddenPaths = useMemo(() => [
    '/',
    '/welcome',
    '/role',
    '/tasker-type',
    '/register',
    '/login',
    '/settings',
    '/wallet/withdraw',
    '/wallet/add-card',
  ], []);

  const shouldHide = useMemo(() => 
    hiddenPaths.includes(location) || 
    location.startsWith('/post-task') || 
    location.startsWith('/task/') ||
    location.startsWith('/chat/'),
    [hiddenPaths, location]
  );

  // Find active index
  const activeIndex = useMemo(() => {
    return navItems.findIndex(item => isActive(item.path));
  }, [navItems, isActive, location]);

  // Spring physics animation - stiffness: 300, damping: 30 for organic liquid movement
  const x = useMotionValue(0);
  const width = useMotionValue(0);
  const springX = useSpring(x, { 
    stiffness: 300, 
    damping: 30, 
    mass: 0.8 
  });
  const springWidth = useSpring(width, { 
    stiffness: 300, 
    damping: 30, 
    mass: 0.8 
  });
  
  const xTransform = useTransform(springX, (val) => `${val}px`);
  const widthTransform = useTransform(springWidth, (val) => `${Math.max(val, 64)}px`);

  // Update position when active index changes - creates stretch and snap effect
  useEffect(() => {
    if (activeIndex === -1 || !containerRef.current) return;

    const container = containerRef.current;
    const activeButton = itemsRef.current[activeIndex];
    
    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      // Calculate center position relative to container
      const buttonCenterX = buttonRect.left + buttonRect.width / 2 - containerRect.left;
      const buttonWidth = buttonRect.width;
      
      // Set position to center the bubble on the button - creates liquid drop effect
      x.set(buttonCenterX - buttonWidth / 2);
      width.set(buttonWidth);
    }
  }, [activeIndex, x, width, navItems.length, location]);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* SVG Filter for Gooey Liquid Effect - creates merging connection */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mb-4 pb-safe">
          {/* Glassmorphism Base: backdrop-blur with semi-transparent border and gradient */}
          <div 
            ref={containerRef}
            className="relative rounded-[32px] px-4 py-3 max-w-md mx-auto shadow-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: "'Cairo', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {/* 3D Glass highlight at top edge */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
              }}
            />
            
            {/* Subtle inner shadow for 3D glass look */}
            <div 
              className="absolute inset-0 rounded-[32px] pointer-events-none"
              style={{
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            />
            {/* Liquid bubble indicator with gooey filter - stretches and snaps like liquid drop */}
            {activeIndex !== -1 && (
              <motion.div
                initial={false}
                style={{
                  x: xTransform,
                  width: widthTransform,
                  filter: 'url(#goo)',
                  WebkitFilter: 'url(#goo)',
                }}
                className="absolute top-2 bottom-2 rounded-[24px] bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 opacity-90"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                {/* Inner glow layers for depth */}
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-orange-300/60 via-red-300/60 to-pink-300/60 blur-sm" />
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-t from-transparent via-white/15 to-white/25" />
                
                {/* 3D glass effect: subtle inner shadow */}
                <div 
                  className="absolute inset-0 rounded-[24px]"
                  style={{
                    boxShadow: `
                      inset 0 2px 8px rgba(0, 0, 0, 0.1),
                      inset 0 1px 2px rgba(255, 255, 255, 0.3),
                      0 0 24px rgba(251, 146, 60, 0.6),
                      0 0 48px rgba(239, 68, 68, 0.5),
                      0 0 72px rgba(236, 72, 153, 0.4)
                    `,
                  }}
                />
                
                {/* Top edge highlight for 3D glass look */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[24px] opacity-70"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
                  }}
                />
                
                {/* Animated shimmer wave */}
                <motion.div
                  animate={{
                    x: ['-100%', '100%'],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 1,
                  }}
                  className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/3"
                />
              </motion.div>
            )}

            {/* Navigation items */}
            <div className="relative flex justify-between items-center">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const label = t(item.labelKey);
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="flex-1 flex justify-center"
                  >
                    <motion.button
                      ref={(el) => {
                        itemsRef.current[index] = el;
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 z-10"
                    >
                      {/* Icon with elevation and glow */}
                      <motion.div
                        animate={{ 
                          y: active ? -10 : 0,
                          scale: active ? 1.2 : 1,
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 28,
                          mass: 0.6
                        }}
                        className="relative"
                      >
                        {/* Glow effect for active icon */}
                        {active && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div 
                              className="absolute w-16 h-16 rounded-full blur-xl"
                              style={{
                                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, rgba(239, 68, 68, 0.5) 50%, rgba(236, 72, 153, 0.4) 100%)',
                                boxShadow: `
                                  0 0 30px rgba(251, 146, 60, 0.8),
                                  0 0 60px rgba(239, 68, 68, 0.6),
                                  0 0 90px rgba(236, 72, 153, 0.4)
                                `,
                              }}
                            />
                          </motion.div>
                        )}
                        
                        <Icon 
                          className={cn(
                            "w-6 h-6 transition-all duration-300 relative z-10",
                            active 
                              ? "text-orange-500 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]" 
                              : "text-gray-600"
                          )}
                          strokeWidth={active ? 2.5 : 2}
                          fill={active ? "currentColor" : "none"}
                        />
                      </motion.div>
                      
                      {/* Label in Arabic */}
                      <motion.span 
                        initial={false}
                        animate={{
                          opacity: active ? 1 : 0.6,
                          fontWeight: active ? 700 : 500,
                          scale: active ? 1.05 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "text-[10px] tracking-[0.05em] transition-all duration-300 relative z-10 whitespace-nowrap",
                          active 
                            ? "text-orange-500" 
                            : "text-gray-600"
                        )}
                        style={{
                          fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif"
                        }}
                      >
                        {label}
                      </motion.span>
                    </motion.button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
});

