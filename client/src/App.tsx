import { Suspense, lazy, memo, useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import ComingSoon from "@/components/ComingSoon";

const WelcomeScreen = lazy(() => import("@/pages/WelcomeScreen"));
const SelectRoleScreen = lazy(() => import("@/pages/SelectRoleScreen"));
const RegisterScreen = lazy(() => import("@/pages/RegisterScreen"));
const LoginScreen = lazy(() => import("@/pages/LoginScreen"));
const HomeScreen = lazy(() => import("@/pages/HomeScreen"));
const TasksFeedScreen = lazy(() => import("@/pages/TasksFeedScreen"));
const MyTasksScreen = lazy(() => import("@/pages/MyTasksScreen"));
const TaskDetailsScreen = lazy(() => import("@/pages/TaskDetailsScreen"));
const PostTaskScreen = lazy(() => import("@/pages/PostTaskScreen"));
const WalletScreen = lazy(() => import("@/pages/WalletScreen"));
const ProfileScreen = lazy(() => import("@/pages/ProfileScreen"));
const ChatScreen = lazy(() => import("@/pages/ChatScreen"));
const ConversationsScreen = lazy(() => import("@/pages/ConversationsScreen"));
const NotificationScreen = lazy(() => import("@/pages/NotificationScreen"));
const SettingsScreen = lazy(() => import("@/pages/SettingsScreen"));
const MapScreen = lazy(() => import("@/pages/MapScreen"));
const EditProfileScreen = lazy(() => import("@/pages/EditProfileScreen"));
const SavedTasksScreen = lazy(() => import("@/pages/SavedTasksScreen"));
const HelpScreen = lazy(() => import("@/pages/HelpScreen"));
const PrivacyPolicyScreen = lazy(() => import("@/pages/PrivacyPolicyScreen"));
const TermsScreen = lazy(() => import("@/pages/TermsScreen"));
const VerifyIdentityScreen = lazy(() => import("@/pages/VerifyIdentityScreen"));
const NotFound = lazy(() => import("@/pages/not-found"));

const PageLoader = memo(function PageLoader() {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm"
        >
          {t('common.loading')}
        </motion.p>
      </div>
    </motion.div>
  );
});

const UnauthenticatedRoutes = memo(function UnauthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={WelcomeScreen} />
      <Route path="/role" component={SelectRoleScreen} />
      <Route path="/register" component={RegisterScreen} />
      <Route path="/login" component={LoginScreen} />
      <Route component={WelcomeScreen} />
    </Switch>
  );
});

const AuthenticatedRoutes = memo(function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeScreen} />
      <Route path="/home" component={HomeScreen} />
      <Route path="/tasks-feed" component={TasksFeedScreen} />
      <Route path="/my-tasks" component={MyTasksScreen} />
      <Route path="/task/:id" component={TaskDetailsScreen} />
      <Route path="/post-task/:step" component={PostTaskScreen} />
      <Route path="/task/:id/edit" component={PostTaskScreen} />
      <Route path="/wallet" component={WalletScreen} />
      <Route path="/profile" component={ProfileScreen} />
      <Route path="/profile/:userId" component={ProfileScreen} />
      <Route path="/profile/edit" component={EditProfileScreen} />
      <Route path="/chat/:taskId" component={ChatScreen} />
      <Route path="/messages" component={ConversationsScreen} />
      <Route path="/notifications" component={NotificationScreen} />
      <Route path="/settings" component={SettingsScreen} />
      <Route path="/map" component={MapScreen} />
      <Route path="/saved" component={SavedTasksScreen} />
      <Route path="/help" component={HelpScreen} />
      <Route path="/privacy" component={PrivacyPolicyScreen} />
      <Route path="/terms" component={TermsScreen} />
      <Route path="/verify" component={VerifyIdentityScreen} />
      <Route component={NotFound} />
    </Switch>
  );
});

const AppContent = memo(function AppContent() {
  const { isAuthenticated, isLoading } = useApp();
  const { isInRiyadh, isLoading: locationLoading, checkLocation } = useLocationHook();
  const [hasCheckedLocation, setHasCheckedLocation] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isInRiyadh') !== null;
    }
    return false;
  });

  useEffect(() => {
    if (!hasCheckedLocation && isAuthenticated && !locationLoading) {
      checkLocation();
      setHasCheckedLocation(true);
    }
  }, [hasCheckedLocation, isAuthenticated, locationLoading, checkLocation]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && hasCheckedLocation && isInRiyadh === false) {
    return <ComingSoon onNotifyMe={() => {
      localStorage.setItem('notifyWhenAvailable', 'true');
    }} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          {isAuthenticated ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />}
        </AnimatePresence>
      </Suspense>
      {isAuthenticated && <BottomNav />}
      <Toaster />
    </div>
  );
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
