import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { TaskCard } from '@/components/TaskCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState, Skeleton } from '@/components/ui/animated';
import { formatCurrency } from '@/lib/currency';
import { Bell, Settings, Wallet, Plus, ArrowRight, TrendingUp, CheckCircle, Search, Heart, Sparkles, GraduationCap, HardHat, Inbox, Clock, CheckCircle2, XCircle, Send, Car, Home, Palette, LayoutGrid, MapPin, Calendar, ChevronRight, ListTodo, Truck, Wrench, Scissors, Package, Zap } from 'lucide-react';
import type { TaskWithDetails, User, DirectServiceRequest } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TASK_CATEGORIES_WITH_SUBS, getCategoryInfo } from '@shared/schema';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const promoCategoryIds = ['pampering', 'beauty_fashion', 'construction', 'special', 'car_care', 'other'] as const;

const categoryIcons: Record<string, typeof Sparkles> = {
  pampering: Heart,
  beauty_fashion: Sparkles,
  teaching_education: GraduationCap,
  construction: Wrench,
  special: Home,
  car_care: Car,
  art: Palette,
  other: Package,
};

// Service categories for client home dashboard - main services to highlight
const serviceCategories = [
  { id: 'car_care', icon: Car, gradient: 'from-blue-500 to-blue-600' },
  { id: 'other', icon: Truck, gradient: 'from-orange-500 to-orange-600' },
  { id: 'construction', icon: Wrench, gradient: 'from-amber-500 to-amber-600' },
  { id: 'special', icon: Home, gradient: 'from-cyan-500 to-cyan-600' },
  { id: 'beauty_fashion', icon: Scissors, gradient: 'from-pink-500 to-pink-600' },
  { id: 'teaching_education', icon: GraduationCap, gradient: 'from-green-500 to-green-600' },
  { id: 'art', icon: Palette, gradient: 'from-purple-500 to-purple-600' },
  { id: 'pampering', icon: Sparkles, gradient: 'from-rose-500 to-rose-600' },
] as const;

const HomeScreen = memo(function HomeScreen() {
  const [, setLocation] = useLocation();
  const { userRole, user } = useApp();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: !!localStorage.getItem('userId'),
  });

  const isAuthenticated = !!localStorage.getItem('userId');
  const isClient = userRole === 'client';
  const isTasker = userRole === 'tasker';

  // Client: Fetch their own tasks (active ones)
  const { data: myTasks, isLoading: myTasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/my'],
    enabled: isAuthenticated && isClient,
  });

  // Tasker: Fetch available tasks in the marketplace
  const { data: availableTasks, isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available'],
    enabled: isAuthenticated && isTasker,
  });

  const { data: stats } = useQuery<{ earnings: number; jobsDone: number }>({
    queryKey: ['/api/stats'],
    enabled: isAuthenticated && isTasker,
  });

  type DirectRequestWithUsers = DirectServiceRequest & {
    client: Omit<User, 'password'> | null;
    tasker: Omit<User, 'password'> | null;
  };

  const { data: directRequests } = useQuery<DirectRequestWithUsers[]>({
    queryKey: ['/api/direct-requests'],
    enabled: isAuthenticated,
  });
  
  const pendingRequestsCount = useMemo(() => 
    directRequests?.filter(r => r.status === 'pending')?.length || 0,
    [directRequests]
  );

  // Client: Filter active tasks (open, assigned, in_progress)
  const activeClientTasks = useMemo(() => 
    isClient 
      ? (myTasks || []).filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).slice(0, 3)
      : [],
    [myTasks, isClient]
  );

  const displayUser = currentUser || user;
  const balance = useMemo(() => 
    displayUser?.balance ? parseFloat(String(displayUser.balance)) : 0,
    [displayUser?.balance]
  );
  
  // Tasker: Recent available tasks for browse
  const recentTasks = useMemo(() => availableTasks?.slice(0, 5) || [], [availableTasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 17) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  }, [t]);

  return (
    <div className="min-h-screen bg-background dark:bg-[#0a0a0b] pt-safe pb-32">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-primary/15 dark:from-blue-500/10 to-primary/5 dark:to-transparent rounded-full blur-3xl rtl:-left-32 rtl:right-auto"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute top-60 -left-24 w-56 h-56 bg-gradient-to-tr from-accent/20 dark:from-emerald-500/10 to-accent/5 dark:to-transparent rounded-full blur-3xl rtl:-right-24 rtl:left-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute bottom-40 right-10 w-40 h-40 bg-gradient-to-tl from-primary/10 dark:from-indigo-500/10 to-transparent rounded-full blur-2xl rtl:left-10 rtl:right-auto"
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            {/* Avatar for Client Home Dashboard */}
            {isClient && (
              <Link href="/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="w-14 h-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                    <AvatarImage src={displayUser?.avatar || ''} alt={displayUser?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-lg font-bold">
                      {displayUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            )}
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-muted-foreground font-medium mb-0.5"
              >
                {greeting}
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-extrabold text-foreground tracking-tight"
              >
                {displayUser?.name || t('common.guest')}
              </motion.h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLocation('/notifications')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 transition-all duration-200"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-foreground/80 dark:text-zinc-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLocation('/settings')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 transition-all duration-200"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5 text-foreground/80 dark:text-zinc-400" />
            </motion.button>
          </div>
        </motion.div>

        {userRole === 'tasker' && (
          <motion.div variants={itemVariants}>
            <Link href="/wallet">
              <motion.div 
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-[28px] mb-6 cursor-pointer"
                data-testid="card-wallet-balance"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary/90" />
                
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl rtl:left-0 rtl:right-auto rtl:-translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl rtl:right-0 rtl:left-auto rtl:translate-x-1/4" />
                </div>
                
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-60" />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-sm text-white/70 font-medium mb-1.5">{t('home.availableBalance')}</p>
                      <p className="text-[40px] font-extrabold text-white tracking-tight leading-none">
                        $<CountUp end={balance} decimals={2} />
                      </p>
                    </div>
                    <motion.div 
                      whileHover={{ rotate: 10 }}
                      className="w-14 h-14 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20"
                    >
                      <Wallet className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
                    <span>{t('home.tapToManageWallet')}</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="rtl:rotate-180"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {userRole === 'tasker' && (
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-3 mb-5"
          >
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="stat-card"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-3.5">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-[28px] font-extrabold text-foreground mb-0.5 tracking-tight">
                $<CountUp end={stats?.earnings || 0} decimals={0} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">{t('home.totalEarnings')}</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="stat-card"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3.5">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[28px] font-extrabold text-foreground mb-0.5 tracking-tight">
                <CountUp end={stats?.jobsDone || 0} decimals={0} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">{t('home.jobsCompleted')}</p>
            </motion.div>
          </motion.div>
        )}

        {userRole === 'tasker' && (
          <motion.div variants={itemVariants}>
            <Link href="/direct-requests">
              <motion.div 
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="glass rounded-[20px] p-4 mb-7 cursor-pointer"
                data-testid="card-direct-requests"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                      <Inbox className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {i18n.language === 'ar' ? 'طلبات الخدمة المباشرة' : 'Direct Service Requests'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pendingRequestsCount > 0 
                          ? (i18n.language === 'ar' 
                              ? `${pendingRequestsCount} طلب جديد` 
                              : `${pendingRequestsCount} new request${pendingRequestsCount > 1 ? 's' : ''}`)
                          : (i18n.language === 'ar' ? 'لا توجد طلبات جديدة' : 'No new requests')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingRequestsCount > 0 && (
                      <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                        {pendingRequestsCount}
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ============ CLIENT: Service Selection Dashboard ============ */}
        {isClient && (
          <>
            {/* What do you need help with? */}
            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {isArabic ? 'ماذا تحتاج اليوم؟' : 'What do you need today?'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'اختر خدمة وسنربطك بأفضل مقدمي الخدمة' : 'Choose a service and we\'ll connect you with the best providers'}
              </p>
            </motion.div>

            {/* Service Grid - Main Dashboard */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="grid grid-cols-2 gap-3">
                {serviceCategories.map((service, index) => {
                  const category = TASK_CATEGORIES_WITH_SUBS[service.id];
                  const IconComponent = service.icon;
                  
                  return (
                    <Link href={`/post-task/1?category=${service.id}`} key={service.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative rounded-[20px] p-5 cursor-pointer overflow-hidden group"
                        data-testid={`service-card-${service.id}`}
                      >
                        {/* Glassmorphism background */}
                        <div className="absolute inset-0 bg-zinc-900/60 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-[20px]" />
                        
                        {/* Gradient glow effect on hover */}
                        <div className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-[20px]",
                          `bg-gradient-to-br ${service.gradient}`
                        )} />
                        
                        {/* Ambient light */}
                        <div 
                          className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
                          style={{ background: `linear-gradient(135deg, ${category?.colorHex || '#3B82F6'}, transparent)` }}
                        />
                        
                        <div className="relative z-10 flex flex-col h-full min-h-[100px]">
                          {/* Icon with gradient background */}
                          <motion.div 
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg",
                              `bg-gradient-to-br ${service.gradient}`
                            )}
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </motion.div>
                          
                          {/* Service name */}
                          <p className="text-sm font-bold text-white leading-tight mb-1">
                            {isArabic ? category?.nameAr : category?.nameEn}
                          </p>
                          
                          {/* Subcategory count hint */}
                          <p className="text-xs text-zinc-400 mt-auto">
                            {category?.subcategories && category.subcategories.length > 0 
                              ? (isArabic 
                                  ? `${category.subcategories.length} خدمات` 
                                  : `${category.subcategories.length} services`)
                              : (isArabic ? 'اطلب الآن' : 'Request now')
                            }
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Action - Post Custom Task */}
            <motion.div variants={itemVariants} className="mb-8">
              <Link href="/post-task/1">
                <motion.button 
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative overflow-hidden rounded-[20px]"
                  data-testid="button-post-custom-task"
                >
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-xl border border-primary/30 rounded-[20px]" />
                  
                  <div className="relative flex items-center gap-4 py-4 px-5">
                    <motion.div 
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </motion.div>
                    <div className="flex-1 text-start">
                      <p className="text-base font-bold text-foreground">
                        {isArabic ? 'طلب خدمة مخصصة' : 'Request Custom Service'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? 'لم تجد ما تبحث عنه؟ أخبرنا' : "Can't find what you need? Tell us"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
                  </div>
                </motion.button>
              </Link>
            </motion.div>

            {/* Active Tasks Section */}
            {activeClientTasks.length > 0 && (
              <>
                <motion.div 
                  variants={itemVariants}
                  className="flex items-center justify-between mb-4"
                >
                  <h2 className="text-lg font-bold text-foreground">
                    {isArabic ? 'مهامي النشطة' : 'My Active Tasks'}
                  </h2>
                  <Link 
                    href="/my-tasks"
                    className="text-sm text-primary font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-300"
                    data-testid="link-see-all-my-tasks"
                  >
                    {t('common.seeAll')}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </motion.div>

                <motion.div variants={containerVariants} className="space-y-3 mb-6">
                  <AnimatePresence mode="wait">
                    {myTasksLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-24 rounded-2xl" />
                        ))}
                      </div>
                    ) : (
                      activeClientTasks.map((task, index) => {
                        const statusConfig: Record<string, { label: string; color: string; bgColor: string; dot: string }> = {
                          open: { label: isArabic ? 'مفتوحة' : 'Open', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
                          assigned: { label: isArabic ? 'تم التعيين' : 'Assigned', color: 'text-blue-400', bgColor: 'bg-blue-500/10', dot: 'bg-blue-400' },
                          in_progress: { label: isArabic ? 'في انتظار الدفع' : 'Waiting Payment', color: 'text-amber-400', bgColor: 'bg-amber-500/10', dot: 'bg-amber-400' },
                        };
                        const config = statusConfig[task.status] || statusConfig.open;
                        const categoryInfo = getCategoryInfo(task.category);
                        const category = categoryInfo 
                          ? TASK_CATEGORIES_WITH_SUBS[categoryInfo.mainCategory]
                          : null;

                        return (
                          <motion.div
                            key={task.id}
                            variants={itemVariants}
                            custom={index}
                          >
                            <Link href={`/task/${task.id}`}>
                              <motion.div
                                whileHover={{ scale: 1.01, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative rounded-[20px] p-4 cursor-pointer overflow-hidden"
                                data-testid={`card-active-task-${task.id}`}
                              >
                                {/* Glassmorphism background */}
                                <div className="absolute inset-0 bg-zinc-900/60 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-[20px]" />
                                
                                <div className="relative z-10 flex items-start gap-3">
                                  <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: category ? `${category.colorHex}20` : 'var(--primary-10)' }}
                                  >
                                    {category && categoryIcons[categoryInfo?.mainCategory || ''] ? (
                                      (() => {
                                        const Icon = categoryIcons[categoryInfo?.mainCategory || ''];
                                        return <Icon className="w-6 h-6" style={{ color: category.colorHex }} />;
                                      })()
                                    ) : (
                                      <ListTodo className="w-6 h-6 text-primary" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <p className="font-bold text-foreground truncate">
                                        {task.title}
                                      </p>
                                      <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                        config.bgColor, config.color
                                      )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                                        {config.label}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[100px]">{task.location}</span>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {task.date}
                                      </span>
                                      <span className="font-semibold text-primary ms-auto">
                                        {formatCurrency(task.budget, { locale: isArabic ? 'ar' : 'en' })}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 rtl:rotate-180 mt-2" />
                                </div>
                              </motion.div>
                            </Link>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </>
        )}

        {/* ============ TASKER/EXECUTOR: Available Tasks Feed ============ */}
        {isTasker && (
          <>
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-5"
            >
              <h2 className="text-lg font-bold text-foreground">
                {isArabic ? 'المهام المتاحة' : 'Available Tasks'}
              </h2>
              <Link 
                href="/tasks-feed"
                className="text-sm text-primary font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-300"
                data-testid="link-see-all-tasks"
              >
                {t('common.seeAll')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              className="space-y-3"
            >
              <AnimatePresence mode="wait">
                {tasksLoading ? (
                  <TaskCardSkeleton count={3} />
                ) : recentTasks.length > 0 ? (
                  recentTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      variants={itemVariants}
                      custom={index}
                    >
                      <TaskCard task={task} index={index} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div variants={itemVariants}>
                    <EmptyState
                      icon={<Search className="w-8 h-8" />}
                      title={isArabic ? 'لا توجد مهام متاحة' : 'No Tasks Available'}
                      description={isArabic ? 'تحقق لاحقاً للحصول على مهام جديدة' : 'Check back later for new tasks'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
});

export default HomeScreen;
