import { memo, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Wallet, User, Home, List, Search, Grid3X3 } from 'lucide-react';

interface NavItem {
  icon: typeof Home;
  labelKey: string;
  path: string;
}

export const BottomNav = memo(function BottomNav() {
  const [location] = useLocation();
  const { userRole } = useApp();
  const { t } = useTranslation();

  const isActive = useCallback((path: string) => {
    if (path === '/home') return location === '/home' || location === '/';
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
          { icon: Grid3X3, labelKey: 'nav.categories', path: '/categories' },
          { icon: Search, labelKey: 'searchTaskers.title', path: '/search-taskers' },
          { icon: User, labelKey: 'nav.profile', path: '/profile' },
        ],
    [userRole]
  );

  const hiddenPaths = useMemo(() => [
    '/',
    '/welcome',
    '/role',
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

  if (shouldHide) {
    return null;
  }

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mb-4 pb-safe">
        <div className="glass-premium rounded-[28px] px-2 py-2 max-w-md mx-auto">
          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const label = t(item.labelKey);
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex-1"
                >
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={cn(
                      "relative w-full flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-[22px] transition-all duration-300",
                      active && "bg-primary/10 dark:bg-primary/20"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {active && (
                        <motion.div
                          layoutId="activeNavPill"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute inset-0 rounded-[22px] bg-gradient-to-r from-primary/15 to-accent/10 dark:from-primary/25 dark:to-accent/15"
                        />
                      )}
                    </AnimatePresence>
                    
                    <motion.div
                      animate={{ 
                        scale: active ? 1 : 0.95,
                        y: active ? -2 : 0
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="relative"
                    >
                      <Icon 
                        className={cn(
                          "w-[22px] h-[22px] transition-all duration-300",
                          active 
                            ? "text-primary drop-shadow-[0_0_8px_rgba(59,91,255,0.4)]" 
                            : "text-muted-foreground"
                        )}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      {active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        />
                      )}
                    </motion.div>
                    
                    <motion.span 
                      initial={false}
                      animate={{
                        opacity: active ? 1 : 0.6,
                        fontWeight: active ? 700 : 500,
                      }}
                      className={cn(
                        "text-[10px] tracking-wide transition-colors duration-300",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
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
  );
});
