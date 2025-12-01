
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptic } from '../hooks/useHaptic';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('userRole') || 'client';
  const { t } = useTranslation();
  const { trigger } = useHaptic();

  const isActive = (path: string) => location.pathname === path;

  // Define Nav items based on Role
  const navItems = role === 'tasker' 
    ? [
        { icon: 'dashboard', label: t.navHome, path: '/home' }, // Dashboard
        { icon: 'list_alt', label: t.navTasks, path: '/tasks-feed' }, // Marketplace
        { icon: 'account_balance_wallet', label: t.navWallet, path: '/wallet' },
        { icon: 'person', label: t.navProfile, path: '/profile' },
      ]
    : [
        { icon: 'home', label: t.navHome, path: '/home' }, // Dashboard
        { icon: 'list', label: t.navMyTasks, path: '/my-tasks' }, // Posted Tasks
        { icon: 'account_balance_wallet', label: t.navWallet, path: '/wallet' },
        { icon: 'person', label: t.navProfile, path: '/profile' },
      ];

  // Define paths where the bottom navigation should be hidden
  const hiddenPaths = [
    '/', 
    '/role', 
    '/register', 
    '/settings',
    '/wallet/withdraw',
    '/wallet/add-card'
  ];

  // Check if current path matches exact hidden paths or starts with specific prefixes
  const shouldHide = hiddenPaths.includes(location.pathname) || 
                     location.pathname.startsWith('/post-task') || 
                     location.pathname.startsWith('/task/') ||
                     location.pathname.startsWith('/chat/');

  if (shouldHide) {
    return null;
  }

  const handleNav = (path: string) => {
      if (location.pathname !== path) {
          trigger(5); // Light tap
          navigate(path);
      }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/85 dark:bg-surface-dark/85 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800/50 pb-safe pt-2 px-6 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] z-40 transition-all duration-500">
      <div className="flex justify-between items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNav(item.path)}
            className={`flex flex-col items-center justify-center gap-1 w-16 group transition-all duration-300 active:scale-90`}
          >
            <div className={`relative p-1.5 rounded-2xl transition-all duration-500 ${isActive(item.path) ? 'bg-primary/10 -translate-y-1 shadow-[0_4px_12px_rgba(19,200,236,0.2)]' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className={`material-symbols-outlined text-[26px] transition-all duration-300 ${
                    isActive(item.path) 
                    ? 'material-symbols-filled text-primary scale-110' 
                    : 'text-text-secondary dark:text-text-secondary-dark group-hover:text-primary/70'
                }`}>
                {item.icon}
                </span>
            </div>
            <span className={`text-[10px] font-bold transition-all duration-300 ${
                isActive(item.path) 
                ? 'text-primary opacity-100 translate-y-0' 
                : 'text-text-secondary dark:text-text-secondary-dark opacity-0 -translate-y-2 h-0 overflow-hidden'
            }`}>
                {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
