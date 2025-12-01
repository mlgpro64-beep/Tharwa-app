import { memo, useCallback, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Settings, Star, CheckCircle, Calendar, 
  MapPin, ChevronRight, User, ListTodo, HelpCircle, Edit3, Shield
} from 'lucide-react';
import type { User as UserType } from '@shared/schema';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const ProfileScreen = memo(function ProfileScreen() {
  const { userId } = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser, userRole } = useApp();
  const { t } = useTranslation();
  
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
      labelKey: 'profile.rating', 
      value: user?.rating ? parseFloat(String(user.rating)).toFixed(1) : '0.0',
      icon: Star,
      color: 'text-warning',
      bgColor: 'bg-gradient-to-br from-warning/20 to-warning/5'
    },
    { 
      labelKey: 'profile.tasksCompleted', 
      value: user?.completedTasks || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-gradient-to-br from-success/20 to-success/5'
    },
    { 
      labelKey: 'profile.memberSince', 
      value: user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear(),
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-gradient-to-br from-primary/20 to-primary/5'
    },
  ], [user]);

  const menuItems = useMemo(() => [
    { icon: User, labelKey: 'profile.editProfile', path: '/profile/edit', testId: 'button-edit-profile-full' },
    { icon: ListTodo, labelKey: userRole === 'tasker' ? 'tasks.assignedTasks' : 'tasks.myTasks', path: '/my-tasks', testId: 'button-my-tasks' },
    { icon: HelpCircle, labelKey: 'settings.help', path: '/help', testId: 'button-help' },
  ], [userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe px-5 py-5">
        <div className="flex items-center justify-center mb-8">
          <Skeleton className="w-28 h-28 rounded-full" />
        </div>
        <Skeleton className="h-8 w-48 mx-auto mb-2 rounded-lg" />
        <Skeleton className="h-4 w-32 mx-auto mb-6 rounded-lg" />
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-20 -right-24 w-72 h-72 bg-gradient-to-br from-accent/25 to-accent/5 rounded-full blur-3xl rtl:-left-24 rtl:right-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-60 -left-16 w-48 h-48 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl rtl:-right-16 rtl:left-auto"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-5 py-5"
      >
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-6"
        >
          {!isOwnProfile ? (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => window.history.back()}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground/80 rtl:rotate-180" />
            </motion.button>
          ) : <div className="w-11" />}
          
          <h1 className="text-xl font-bold text-foreground">
            {isOwnProfile ? t('profile.title') : t('profile.myProfile')}
          </h1>
          
          {isOwnProfile ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLocation('/settings')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5 text-foreground/80" />
            </motion.button>
          ) : <div className="w-11" />}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center mb-7"
        >
          <div className="relative mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 to-accent/40 rounded-full blur-md" />
              <Avatar className="relative w-28 h-28 border-4 border-white/50 dark:border-white/20 shadow-2xl">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            {isOwnProfile && (
              <Link href="/profile/edit">
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -bottom-1 -right-1 w-10 h-10 gradient-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white/50 rtl:-left-1 rtl:right-auto"
                  data-testid="button-edit-profile"
                >
                  <Edit3 className="w-4 h-4" />
                </motion.button>
              </Link>
            )}
          </div>
          
          <h2 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">{user?.name || t('common.guest')}</h2>
          <p className="text-muted-foreground text-sm mb-4">@{user?.username || 'guest'}</p>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider",
              userRole === 'tasker' 
                ? "bg-success/15 text-success" 
                : "bg-primary/15 text-primary"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            {userRole === 'tasker' ? t('roles.tasker') : t('roles.client')}
          </motion.div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="glass rounded-[20px] p-4 text-center"
              >
                <div className={cn("w-9 h-9 rounded-xl mx-auto mb-2.5 flex items-center justify-center", stat.bgColor)}>
                  <Icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{t(stat.labelKey)}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {user?.bio && (
          <motion.div
            variants={itemVariants}
            className="glass rounded-[20px] p-5 mb-4"
          >
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{t('profile.about')}</h3>
            <p className="text-foreground leading-relaxed text-sm">{user.bio}</p>
          </motion.div>
        )}

        {user?.location && (
          <motion.div
            variants={itemVariants}
            className="glass rounded-[20px] p-4 mb-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t('tasks.location')}</p>
                <p className="font-bold text-foreground">{user.location}</p>
              </div>
            </div>
          </motion.div>
        )}

        {isOwnProfile && (
          <motion.div
            variants={itemVariants}
            className="space-y-2.5"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">{t('wallet.quickActions')}</p>
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
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full glass rounded-[18px] font-semibold flex items-center justify-between p-4"
                      data-testid={item.testId}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground text-sm">{t(item.labelKey)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                    </motion.button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});

export default ProfileScreen;
