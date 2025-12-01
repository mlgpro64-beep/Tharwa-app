import { memo, useCallback, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Settings, Star, CheckCircle, Calendar, 
  MapPin, ChevronRight, User, ListTodo, HelpCircle, Edit3
} from 'lucide-react';
import type { User as UserType } from '@shared/schema';

const ProfileScreen = memo(function ProfileScreen() {
  const { userId } = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser, userRole } = useApp();
  
  const isOwnProfile = !userId;
  
  const { data: profileUser, isLoading } = useQuery<UserType>({
    queryKey: ['/api/users', userId || 'me'],
  });

  const user = profileUser || currentUser;

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const stats = useMemo(() => [
    { 
      label: 'Rating', 
      value: user?.rating ? parseFloat(String(user.rating)).toFixed(1) : '0.0',
      icon: Star,
      color: 'text-warning',
      bgColor: 'bg-warning/15'
    },
    { 
      label: 'Completed', 
      value: user?.completedTasks || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/15'
    },
    { 
      label: 'Since', 
      value: user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear(),
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/15'
    },
  ], [user]);

  const menuItems = useMemo(() => [
    { icon: User, label: 'Edit Profile', path: '/profile/edit', testId: 'button-edit-profile-full' },
    { icon: ListTodo, label: userRole === 'tasker' ? 'My Jobs' : 'My Tasks', path: '/my-tasks', testId: 'button-my-tasks' },
    { icon: HelpCircle, label: 'Help Center', path: '/help', testId: 'button-help' },
  ], [userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-safe px-6 py-6">
        <div className="flex items-center justify-center mb-8">
          <Skeleton className="w-28 h-28 rounded-full" />
        </div>
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          {!isOwnProfile ? (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          ) : <div className="w-11" />}
          
          <h1 className="text-2xl font-extrabold text-foreground">
            {isOwnProfile ? 'Profile' : 'User Profile'}
          </h1>
          
          {isOwnProfile ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation('/settings')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          ) : <div className="w-11" />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Avatar className="w-28 h-28 border-4 border-white/20 shadow-2xl">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            {isOwnProfile && (
              <Link href="/profile/edit">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -bottom-1 -right-1 w-10 h-10 gradient-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
                  data-testid="button-edit-profile"
                >
                  <Edit3 className="w-4 h-4" />
                </motion.button>
              </Link>
            )}
          </div>
          
          <h2 className="text-2xl font-extrabold text-foreground mb-1">{user?.name || 'Guest'}</h2>
          <p className="text-muted-foreground mb-4">@{user?.username || 'guest'}</p>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest border",
              userRole === 'tasker' 
                ? "bg-success/15 text-success border-success/20" 
                : "bg-primary/15 text-primary border-primary/20"
            )}
          >
            {userRole === 'tasker' ? 'Tasker' : 'Client'}
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="glass rounded-3xl p-4 text-center"
              >
                <div className={cn("w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center", stat.bgColor)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {user?.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-5 mb-6"
          >
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">About</h3>
            <p className="text-foreground leading-relaxed">{user.bio}</p>
          </motion.div>
        )}

        {user?.location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-3xl p-5 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="font-bold text-foreground text-lg">{user.location}</p>
              </div>
            </div>
          </motion.div>
        )}

        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.05 }}
                >
                  <Link href={item.path}>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-16 glass rounded-2xl font-bold flex items-center justify-between px-5"
                      data-testid={item.testId}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-foreground">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default ProfileScreen;
