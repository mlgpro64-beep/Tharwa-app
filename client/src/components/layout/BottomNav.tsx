import { memo, useMemo, useCallback, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LayoutGrid, ListTodo, User, Home, Search, Send, Briefcase } from 'lucide-react';

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
  const navRef = useRef<HTMLDivElement>(null);

  const isActive = useCallback((path: string) => {
    if (path === '/home') return location === '/home' || location === '/';
    if (path === '/tasks-feed') return location === '/tasks-feed' || location.startsWith('/tasks-feed');
    if (path === '/my-tasks') return location === '/my-tasks' || location.startsWith('/my-tasks');
    return location === path || location.startsWith(path + '/');
  }, [location]);

  // Role-based navigation:
  // Client: Home (Categories Dashboard) -> My Tasks -> Profile
  // Executor/Tasker: Browse Tasks (Marketplace) -> My Offers -> Profile
  const navItems: NavItem[] = useMemo(() => 
    userRole === 'tasker' 
      ? [
          { icon: Search, labelKey: 'nav.browseTasks', path: '/tasks-feed' },
          { icon: Send, labelKey: 'nav.myOffers', path: '/my-tasks' },
          { icon: User, labelKey: 'nav.profile', path: '/profile' },
        ]
      : [
          { icon: LayoutGrid, labelKey: 'nav.home', path: '/home' },
          { icon: Briefcase, labelKey: 'tasks.myTasks', path: '/my-tasks' },
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
    '/verify-otp',
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
      ref={navRef}
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none"
    >
      <div className="mx-4 mb-6 pb-safe flex justify-center">
        {/* Glass Effect Navigation Bar - Deep Dark Theme */}
        <div className="relative flex items-center bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full p-1.5 border border-gray-200/50 dark:border-zinc-800/50 shadow-lg dark:shadow-2xl dark:shadow-black/50 pointer-events-auto max-w-fit mx-auto">
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
                      active ? "text-primary dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-gray-100 dark:bg-zinc-800 rounded-full border border-gray-200/50 dark:border-zinc-700/50"
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
