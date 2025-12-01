import { memo, useMemo, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Wallet, User, Home, List } from 'lucide-react';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

export const BottomNav = memo(function BottomNav() {
  const [location] = useLocation();
  const { userRole } = useApp();

  const isActive = useCallback((path: string) => {
    if (path === '/home') return location === '/home' || location === '/';
    return location === path || location.startsWith(path + '/');
  }, [location]);

  const navItems: NavItem[] = useMemo(() => 
    userRole === 'tasker' 
      ? [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/home' },
          { icon: ListTodo, label: 'Tasks', path: '/tasks-feed' },
          { icon: Wallet, label: 'Wallet', path: '/wallet' },
          { icon: User, label: 'Profile', path: '/profile' },
        ]
      : [
          { icon: Home, label: 'Home', path: '/home' },
          { icon: List, label: 'My Tasks', path: '/my-tasks' },
          { icon: Wallet, label: 'Wallet', path: '/wallet' },
          { icon: User, label: 'Profile', path: '/profile' },
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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-2xl border-t border-white/10 dark:border-white/5 pb-safe pt-3 px-6 z-50"
    >
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center gap-1.5 w-16 group relative"
              >
                <motion.div 
                  animate={{ 
                    y: active ? -4 : 0,
                    scale: active ? 1.1 : 1
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "relative p-2.5 rounded-2xl transition-colors duration-300",
                    active 
                      ? "bg-primary/15" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="navIndicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-primary/15 -z-10"
                      />
                    )}
                  </AnimatePresence>
                  
                  <Icon 
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      active 
                        ? "text-primary" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </motion.div>
                
                <AnimatePresence>
                  {active && (
                    <motion.span 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[10px] font-bold text-primary"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
});
