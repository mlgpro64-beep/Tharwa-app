
import React, { useEffect, Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { ToastProvider } from './components/Toast';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';

// Explicit Lazy Load Screens to avoid module resolution issues
const WelcomeScreen = lazy(() => import('./screens/AuthScreens').then(m => ({ default: m.WelcomeScreen })));
const SelectRoleScreen = lazy(() => import('./screens/AuthScreens').then(m => ({ default: m.SelectRoleScreen })));
const CreateAccountScreen = lazy(() => import('./screens/AuthScreens').then(m => ({ default: m.CreateAccountScreen })));

const HomeScreen = lazy(() => import('./screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const TasksFeedScreen = lazy(() => import('./screens/HomeScreen').then(m => ({ default: m.TasksFeedScreen })));

const MapScreen = lazy(() => import('./screens/MapScreen').then(m => ({ default: m.MapScreen })));

const PostTaskScreen = lazy(() => import('./screens/TaskScreens').then(m => ({ default: m.PostTaskScreen })));
const TaskDetailsScreen = lazy(() => import('./screens/TaskScreens').then(m => ({ default: m.TaskDetailsScreen })));
const TaskInProgressScreen = lazy(() => import('./screens/TaskScreens').then(m => ({ default: m.TaskInProgressScreen })));
const TaskCompletedScreen = lazy(() => import('./screens/TaskScreens').then(m => ({ default: m.TaskCompletedScreen })));

const MyTasksScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.MyTasksScreen })));
const WalletScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.WalletScreen })));
const WithdrawScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.WithdrawScreen })));
const AddCardScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.AddCardScreen })));
const TransactionDetailsScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.TransactionDetailsScreen })));
const ProfileScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.ProfileScreen })));
const EditProfileScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.EditProfileScreen })));
const SettingsScreen = lazy(() => import('./screens/UserScreens').then(m => ({ default: m.SettingsScreen })));

const ChatScreen = lazy(() => import('./screens/ChatScreen').then(m => ({ default: m.ChatScreen })));
const NotificationScreen = lazy(() => import('./screens/NotificationScreen').then(m => ({ default: m.NotificationScreen })));

const HelpCenterScreen = lazy(() => import('./screens/SupportScreens').then(m => ({ default: m.HelpCenterScreen })));
const TermsScreen = lazy(() => import('./screens/SupportScreens').then(m => ({ default: m.TermsScreen })));
const PrivacyScreen = lazy(() => import('./screens/SupportScreens').then(m => ({ default: m.PrivacyScreen })));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initialization (Auth check, Asset loading)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <div className="antialiased text-text-primary dark:text-text-primary-dark transition-colors duration-300">
        <Suspense fallback={<div className="min-h-screen bg-background-light dark:bg-background-dark"></div>}>
          <Routes>
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/role" element={<SelectRoleScreen />} />
            <Route path="/register" element={<CreateAccountScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/tasks-feed" element={<TasksFeedScreen />} />
            <Route path="/map" element={<MapScreen />} />
            <Route path="/post-task/:step" element={<PostTaskScreen />} />
            <Route path="/task/:id" element={<TaskDetailsScreen />} />
            <Route path="/task/:id/edit" element={<PostTaskScreen isEditMode={true} />} />
            <Route path="/task/:id/progress" element={<TaskInProgressScreen />} />
            <Route path="/task/:id/rate" element={<TaskCompletedScreen />} />
            <Route path="/my-tasks" element={<MyTasksScreen />} />
            <Route path="/wallet" element={<WalletScreen />} />
            <Route path="/wallet/withdraw" element={<WithdrawScreen />} />
            <Route path="/wallet/add-card" element={<AddCardScreen />} />
            <Route path="/wallet/transaction/:id" element={<TransactionDetailsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/edit" element={<EditProfileScreen />} />
            <Route path="/profile/:userId" element={<ProfileScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/chat/:taskId" element={<ChatScreen />} />
            <Route path="/notifications" element={<NotificationScreen />} />
            <Route path="/help" element={<HelpCenterScreen />} />
            <Route path="/terms" element={<TermsScreen />} />
            <Route path="/privacy" element={<PrivacyScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
