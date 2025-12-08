import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { User, Task, Transaction, Notification, Bid, TaskWithDetails } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export type UserRole = 'client' | 'tasker';

interface AppContextType {
  user: User | null;
  userRole: UserRole;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  isLoading: boolean;
  savedTaskIds: string[];
  setUser: (user: User | null) => void;
  toggleTheme: () => void;
  switchRole: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  setLocalRole: (role: UserRole) => void;
  toggleSavedTask: (taskId: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('userRole') as UserRole) || 'client';
    }
    return 'client';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [savedTaskIds, setSavedTaskIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('savedTaskIds');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          if (userData.role) {
            setUserRole(userData.role as UserRole);
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('savedTaskIds', JSON.stringify(savedTaskIds));
  }, [savedTaskIds]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setLocalRole = useCallback((role: UserRole) => {
    setUserRole(role);
  }, []);

  const switchRole = useCallback(async (role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRequest('POST', '/api/users/switch-role', { role });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUserRole(role);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to switch role' };
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const toggleSavedTask = useCallback((taskId: string) => {
    setSavedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('userId');
  }, []);

  const contextValue = useMemo(() => ({
    user,
    userRole,
    theme,
    isAuthenticated: !!user,
    isLoading,
    savedTaskIds,
    setUser,
    toggleTheme,
    switchRole,
    setLocalRole,
    toggleSavedTask,
    logout,
  }), [user, userRole, theme, isLoading, savedTaskIds, toggleTheme, switchRole, setLocalRole, toggleSavedTask, logout]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
