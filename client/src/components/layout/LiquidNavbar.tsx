import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Wallet, User, Home, List, Search, Plus } from 'lucide-react';

interface NavItem {
  icon: typeof Home;
  labelKey: string;
  path: string;
  isCenter?: boolean;
}

export const LiquidNavbar = memo(function LiquidNavbar() {
  const [location] = useLocation();
  const { userRole } = useApp();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const isActive = useCallback((path: string) => {
    if (path === '/home') return location === '/home' || location === '/';
    if (path === '/post-task/1') return location === '/post-task/1' || location.startsWith('/post-task/1');
    return location === path || location.startsWith(path + '/');
  }, [location]);

  const navItems: NavItem[] = useMemo(() => 
    userRole === 'tasker' 
      ? [
          { icon: LayoutDashboard, labelKey: 'nav.home', path: '/home' },
          { icon: ListTodo, labelKey: 'nav.tasks', path: '/tasks-feed' },
          { icon: Wallet, labelKey: 'wallet.title', path: '/wallet' },
          { icon: User, labelKey: 'nav.profile', path: '/profile' },
        ]
      : [
          { icon: Home, labelKey: 'nav.home', path: '/home' },
          { icon: List, labelKey: 'tasks.myTasks', path: '/my-tasks' },
          { icon: Plus, labelKey: 'nav.categories', path: '/post-task/1', isCenter: true },
          { icon: Search, labelKey: 'searchTaskers.title', path: '/search-taskers' },
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

  // Spring animation values for liquid bubble with elastic gooey effect
  const x = useMotionValue(0);
  const width = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.7 });
  const springWidth = useSpring(width, { stiffness: 260, damping: 26, mass: 0.7 });
  
  const xTransform = useTransform(springX, (val) => `${val}px`);
  const widthTransform = useTransform(springWidth, (val) => `${val}px`);

  // Update position when active index changes
  useEffect(() => {
    if (activeIndex === -1 || !containerRef.current) return;

    const container = containerRef.current;
    const activeButton = itemsRef.current[activeIndex];
    
    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      // Calculate position relative to container
      const buttonLeft = buttonRect.left - containerRect.left;
      const buttonWidth = buttonRect.width;
      
      x.set(buttonLeft);
      width.set(buttonWidth);
    }
  }, [activeIndex, x, width, navItems.length]);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* SVG Filter for Advanced Gooey Liquid Effect */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="gooey-liquid" x="-100%" y="-100%" width="300%" height="300%">
            {/* Primary blur for gooey effect */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            {/* Color matrix threshold - creates liquid merge/blend effect */}
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  
                      0 1 0 0 0  
                      0 0 1 0 0  
                      0 0 0 18 -8"
              result="gooey"
            />
            {/* Composite with source for final liquid effect */}
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
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
          {/* Ultra-transparent glass container with backdrop blur */}
          <div 
            ref={containerRef}
            className="liquid-navbar-container relative bg-white/5 dark:bg-gray-900/5 backdrop-blur-[20px] rounded-[36px] px-4 py-3 max-w-md mx-auto border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            style={{
              fontFamily: "'Cairo', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Liquid bubble indicator with gooey filter */}
            <AnimatePresence>
              {activeIndex !== -1 && (
                <motion.div
                  initial={false}
                  style={{
                    x: xTransform,
                    width: widthTransform,
                    filter: 'url(#gooey-liquid)',
                    WebkitFilter: 'url(#gooey-liquid)',
                  }}
                  className="liquid-bubble absolute top-2.5 bottom-2.5 rounded-[28px] bg-gradient-to-br from-orange-400/45 via-red-400/45 to-pink-400/45 backdrop-blur-md border border-white/25 dark:border-white/20 overflow-hidden"
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 26,
                    mass: 0.7,
                  }}
                >
                  {/* Inner glow layers */}
                  <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-orange-500/25 via-red-500/25 to-pink-500/25 blur-sm" />
                  <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                  
                  {/* Neon glow shadow with orange/red gradient */}
                  <div 
                    className="absolute inset-0 rounded-[28px] opacity-70"
                    style={{
                      boxShadow: `
                        0 0 24px rgba(251, 146, 60, 0.5),
                        0 0 48px rgba(239, 68, 68, 0.4),
                        0 0 72px rgba(236, 72, 153, 0.3),
                        inset 0 0 24px rgba(255, 255, 255, 0.15)
                      `,
                    }}
                  />
                  
                  {/* Animated liquid shimmer wave */}
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.8,
                    }}
                    className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/3"
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 transition-all duration-300 z-10"
                    >
                      {/* Icon with liquid elevation */}
                      <motion.div
                        animate={{ 
                          y: active ? -6 : 0,
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
                        {/* Neon glow effect for active icon with orange/red gradient */}
                        {active && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div 
                              className="absolute w-14 h-14 rounded-full blur-lg"
                              style={{
                                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.5) 0%, rgba(239, 68, 68, 0.4) 50%, rgba(236, 72, 153, 0.3) 100%)',
                                boxShadow: `
                                  0 0 24px rgba(251, 146, 60, 0.6),
                                  0 0 48px rgba(239, 68, 68, 0.5),
                                  0 0 72px rgba(236, 72, 153, 0.4)
                                `,
                              }}
                            />
                          </motion.div>
                        )}
                        
                        <Icon 
                          className={cn(
                            "w-6 h-6 transition-all duration-300 relative z-10",
                            active 
                              ? "text-orange-500 dark:text-orange-400 drop-shadow-[0_0_16px_rgba(251,146,60,0.7)]" 
                              : "text-gray-600 dark:text-gray-400"
                          )}
                          strokeWidth={active ? 2.5 : 2}
                          fill={active ? "currentColor" : "none"}
                        />
                      </motion.div>
                      
                      {/* Label with Arabic support */}
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
                            ? "text-orange-500 dark:text-orange-400" 
                            : "text-gray-600 dark:text-gray-400"
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

