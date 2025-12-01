
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Task, Transaction, Notification } from '../types';
import { MOCK_USER, AVAILABLE_TASKS, MY_POSTED_TASKS, MOCK_TRANSACTIONS, MOCK_NOTIFICATIONS } from '../data/mockData';
import { generateId } from '../utils/helpers';

interface AppContextType {
  user: User;
  availableTasks: Task[];
  myTasks: Task[];
  transactions: Transaction[];
  notifications: Notification[];
  userRole: 'client' | 'tasker';
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  savedTaskIds: string[];
  myBids: { taskId: string; amount: number; status: 'pending' | 'accepted' | 'rejected' }[];
  stats: { earnings: number; jobsDone: number };
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  switchRole: (role: 'client' | 'tasker') => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  cancelTask: (taskId: string) => void;
  addTransaction: (transaction: Transaction) => void;
  markNotificationRead: (id: number) => void;
  updateUserBalance: (amount: number) => void;
  toggleSavedTask: (taskId: string) => Promise<void>;
  placeBid: (taskId: string, amount: number) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Helper for safe local storage parsing with type guard
const getSafeStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // -- Initialize State --
  const [user, setUser] = useState<User>(() => getSafeStorage('app_user', MOCK_USER));
  const [availableTasks, setAvailableTasks] = useState<Task[]>(() => getSafeStorage('app_availableTasks', AVAILABLE_TASKS));
  const [myTasks, setMyTasks] = useState<Task[]>(() => getSafeStorage('app_myTasks', MY_POSTED_TASKS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getSafeStorage('app_transactions', MOCK_TRANSACTIONS));
  const [notifications, setNotifications] = useState<Notification[]>(() => getSafeStorage('app_notifications', MOCK_NOTIFICATIONS));
  const [userRole, setUserRole] = useState<'client' | 'tasker'>(() => (localStorage.getItem('userRole') as 'client' | 'tasker') || 'client');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [language, setLanguageState] = useState<'en' | 'ar'>(() => (localStorage.getItem('app_language') as 'en' | 'ar') || 'en');
  const [savedTaskIds, setSavedTaskIds] = useState<string[]>(() => getSafeStorage('app_savedTaskIds', []));
  const [myBids, setMyBids] = useState<{ taskId: string; amount: number; status: 'pending' | 'accepted' | 'rejected' }[]>(() => getSafeStorage('app_myBids', []));

  // -- Derived Stats (Memoized) --
  const stats = useMemo(() => ({
      earnings: transactions
        .filter(t => t.type === 'credit')
        .reduce((acc, curr) => acc + curr.amount, 0),
      jobsDone: myTasks.filter(t => t.status === 'completed').length
  }), [transactions, myTasks]);

  // -- Persistence Effects --
  useEffect(() => {
    try {
      localStorage.setItem('app_user', JSON.stringify(user));
      localStorage.setItem('app_availableTasks', JSON.stringify(availableTasks));
      localStorage.setItem('app_myTasks', JSON.stringify(myTasks));
      localStorage.setItem('app_transactions', JSON.stringify(transactions));
      localStorage.setItem('app_notifications', JSON.stringify(notifications));
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('app_savedTaskIds', JSON.stringify(savedTaskIds));
      localStorage.setItem('app_myBids', JSON.stringify(myBids));
      localStorage.setItem('app_language', language);
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [user, availableTasks, myTasks, transactions, notifications, userRole, savedTaskIds, myBids, language, theme]);
  
  // Theme Effect
  useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
  }, [theme]);

  // Language/Direction Effect
  useEffect(() => {
      const root = window.document.documentElement;
      root.dir = language === 'ar' ? 'rtl' : 'ltr';
      root.lang = language;
  }, [language]);

  // -- Actions (Memoized with useCallback for performance) --

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
  const setLanguage = useCallback((lang: 'en' | 'ar') => setLanguageState(lang), []);
  const switchRole = useCallback((role: 'client' | 'tasker') => setUserRole(role), []);

  const addTask = useCallback((task: Task) => {
    const newTask = { ...task, id: generateId(), clientName: user.name, status: 'open' as const };
    setMyTasks(prev => [newTask, ...prev]);
  }, [user.name]);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    setAvailableTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'cancelled' } : t));
    setAvailableTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    setUser(prev => ({ 
        ...prev, 
        balance: transaction.type === 'credit' ? prev.balance + transaction.amount : prev.balance - transaction.amount 
    }));
  }, []);

  const updateUserBalance = useCallback((amount: number) => {
      setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Optimistic UI: Update state immediately, then mock API call
  const toggleSavedTask = useCallback(async (taskId: string) => {
      // 1. Snapshot previous state
      const previousSaved = [...savedTaskIds];
      
      // 2. Optimistic Update
      setSavedTaskIds(prev => 
          prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
      );

      // 3. Simulate API Call
      try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Mock 500ms latency
          // Success - do nothing, state is already updated
      } catch (error) {
          // 4. Rollback on error
          console.error("Failed to toggle save", error);
          setSavedTaskIds(previousSaved);
          throw error;
      }
  }, [savedTaskIds]);

  // Optimistic UI for Bidding
  const placeBid = useCallback(async (taskId: string, amount: number) => {
      const previousBids = [...myBids];
      
      setMyBids(prev => [...prev, { taskId, amount, status: 'pending' }]);

      try {
          await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
          setMyBids(previousBids);
          throw error;
      }
  }, [myBids]);

  const updateUserProfile = useCallback((data: Partial<User>) => {
      setUser(prev => ({ ...prev, ...data }));
  }, []);

  // Memoize the entire context value to prevent downstream re-renders
  const contextValue = useMemo(() => ({
      user, availableTasks, myTasks, transactions, notifications, userRole, theme, language, savedTaskIds, myBids, stats,
      toggleTheme, setLanguage, switchRole, addTask, updateTaskStatus, cancelTask, addTransaction, markNotificationRead, updateUserBalance, toggleSavedTask, placeBid, updateUserProfile
  }), [user, availableTasks, myTasks, transactions, notifications, userRole, theme, language, savedTaskIds, myBids, stats, toggleTheme, setLanguage, switchRole, addTask, updateTaskStatus, cancelTask, addTransaction, markNotificationRead, updateUserBalance, toggleSavedTask, placeBid, updateUserProfile]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
