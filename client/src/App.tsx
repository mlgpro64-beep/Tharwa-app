import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/layout/BottomNav";

import WelcomeScreen from "@/pages/WelcomeScreen";
import SelectRoleScreen from "@/pages/SelectRoleScreen";
import RegisterScreen from "@/pages/RegisterScreen";
import LoginScreen from "@/pages/LoginScreen";
import HomeScreen from "@/pages/HomeScreen";
import TasksFeedScreen from "@/pages/TasksFeedScreen";
import MyTasksScreen from "@/pages/MyTasksScreen";
import TaskDetailsScreen from "@/pages/TaskDetailsScreen";
import PostTaskScreen from "@/pages/PostTaskScreen";
import WalletScreen from "@/pages/WalletScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import ChatScreen from "@/pages/ChatScreen";
import ConversationsScreen from "@/pages/ConversationsScreen";
import NotificationScreen from "@/pages/NotificationScreen";
import SettingsScreen from "@/pages/SettingsScreen";
import MapScreen from "@/pages/MapScreen";
import EditProfileScreen from "@/pages/EditProfileScreen";
import SavedTasksScreen from "@/pages/SavedTasksScreen";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { isAuthenticated, userRole } = useApp();

  const showBottomNav = isAuthenticated;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/" component={WelcomeScreen} />
            <Route path="/select-role" component={SelectRoleScreen} />
            <Route path="/register" component={RegisterScreen} />
            <Route path="/login" component={LoginScreen} />
            <Route component={WelcomeScreen} />
          </>
        ) : (
          <>
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
            <Route component={NotFound} />
          </>
        )}
      </Switch>
      {showBottomNav && <BottomNav />}
      <Toaster />
    </div>
  );
}

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
