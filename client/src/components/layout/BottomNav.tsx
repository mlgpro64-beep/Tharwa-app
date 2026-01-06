import { memo, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
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

export const BottomNav = memo(function BottomNav() {
  const [location] = useLocation();
  const { userRole } = useApp();
  const { t } = useTranslation();

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

  if (shouldHide) {
    return null;
  }

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="mx-4 mb-8 pb-safe flex justify-center">
        {/* Glass Effect Navigation Bar */}
        <div className="relative flex items-center bg-white/80 dark:bg-black/20 backdrop-blur-xl rounded-full p-1.5 border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl pointer-events-auto max-w-fit mx-auto">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const label = t(item.labelKey);
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors duration-300 outline-none",
                      active ? "text-primary dark:text-white" : "text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white/90"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-black/5 dark:bg-white/20 backdrop-blur-md rounded-full border border-black/5 dark:border-white/30 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <Icon 
                      className={cn(
                        "w-5 h-5 relative z-10 transition-transform duration-300",
                        active && "scale-110"
                      )} 
                      strokeWidth={active ? 2.5 : 2}
                    />
                    
                    {active && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-bold relative z-10 whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
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
