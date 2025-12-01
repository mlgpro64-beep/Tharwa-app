import { useLocation, Link } from 'wouter';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

export function BottomNav() {
  const [location] = useLocation();
  const { userRole } = useApp();

  const isActive = (path: string) => {
    if (path === '/home') return location === '/home' || location === '/';
    return location === path || location.startsWith(path + '/');
  };

  const navItems: NavItem[] = userRole === 'tasker' 
    ? [
        { icon: 'dashboard', label: 'Dashboard', path: '/home' },
        { icon: 'list_alt', label: 'Tasks', path: '/tasks-feed' },
        { icon: 'account_balance_wallet', label: 'Wallet', path: '/wallet' },
        { icon: 'person', label: 'Profile', path: '/profile' },
      ]
    : [
        { icon: 'home', label: 'Home', path: '/home' },
        { icon: 'list', label: 'My Tasks', path: '/my-tasks' },
        { icon: 'account_balance_wallet', label: 'Wallet', path: '/wallet' },
        { icon: 'person', label: 'Profile', path: '/profile' },
      ];

  const hiddenPaths = [
    '/',
    '/welcome',
    '/role',
    '/register',
    '/login',
    '/settings',
    '/wallet/withdraw',
    '/wallet/add-card',
  ];

  const shouldHide = hiddenPaths.includes(location) || 
                     location.startsWith('/post-task') || 
                     location.startsWith('/task/') ||
                     location.startsWith('/chat/');

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/90 dark:bg-card/90 backdrop-blur-xl border-t border-border pb-safe pt-2 px-6 shadow-lg z-50 transition-all duration-300">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <button
              className="flex flex-col items-center justify-center gap-1 w-16 group transition-all duration-300 active:scale-90"
            >
              <div 
                className={cn(
                  "relative p-1.5 rounded-2xl transition-all duration-500",
                  isActive(item.path) 
                    ? "bg-primary/10 -translate-y-1 shadow-lg shadow-primary/20" 
                    : "hover:bg-muted"
                )}
              >
                <span 
                  className={cn(
                    "material-symbols-outlined text-[26px] transition-all duration-300",
                    isActive(item.path) 
                      ? "material-symbols-filled text-primary scale-110" 
                      : "text-muted-foreground group-hover:text-primary/70"
                  )}
                >
                  {item.icon}
                </span>
              </div>
              <span 
                className={cn(
                  "text-[10px] font-bold transition-all duration-300",
                  isActive(item.path) 
                    ? "text-primary opacity-100 translate-y-0" 
                    : "text-muted-foreground opacity-0 -translate-y-2 h-0 overflow-hidden"
                )}
              >
                {item.label}
              </span>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
