import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { TaskCard } from '@/components/TaskCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { Bell, Settings, Wallet, Plus, ArrowRight, TrendingUp, CheckCircle, Search, Sparkles, GraduationCap, HardHat, Inbox, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';
import type { TaskWithDetails, User, DirectServiceRequest } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TASK_CATEGORIES_WITH_SUBS } from '@shared/schema';

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

const promoCategoryIds = ['beauty_fashion', 'teaching_education', 'construction'] as const;

const categoryIcons: Record<string, typeof Sparkles> = {
  beauty_fashion: Sparkles,
  teaching_education: GraduationCap,
  construction: HardHat,
};

const HomeScreen = memo(function HomeScreen() {
  const [, setLocation] = useLocation();
  const { userRole, user } = useApp();
  const { t, i18n } = useTranslation();

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: !!localStorage.getItem('userId'),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks', userRole === 'tasker' ? 'available' : 'my'],
  });

  const { data: stats } = useQuery<{ earnings: number; jobsDone: number }>({
    queryKey: ['/api/stats'],
    enabled: userRole === 'tasker',
  });

  type DirectRequestWithUsers = DirectServiceRequest & {
    client: Omit<User, 'password'> | null;
    tasker: Omit<User, 'password'> | null;
  };

  const { data: directRequests } = useQuery<DirectRequestWithUsers[]>({
    queryKey: ['/api/direct-requests'],
  });
  
  const pendingRequestsCount = useMemo(() => 
    directRequests?.filter(r => r.status === 'pending')?.length || 0,
    [directRequests]
  );

  const clientDirectRequests = useMemo(() => 
    userRole === 'client' ? (directRequests || []).slice(0, 3) : [],
    [directRequests, userRole]
  );

  const displayUser = currentUser || user;
  const balance = useMemo(() => 
    displayUser?.balance ? parseFloat(String(displayUser.balance)) : 0,
    [displayUser?.balance]
  );
  const recentTasks = useMemo(() => tasks?.slice(0, 3) || [], [tasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 17) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  }, [t]);

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl rtl:-left-32 rtl:right-auto"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute top-60 -left-24 w-56 h-56 bg-gradient-to-tr from-accent/25 to-accent/5 rounded-full blur-3xl rtl:-right-24 rtl:left-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute bottom-40 right-10 w-40 h-40 bg-gradient-to-tl from-primary/15 to-transparent rounded-full blur-2xl rtl:left-10 rtl:right-auto"
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
          <div className="flex items-center gap-2.5">
            {userRole === 'client' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setLocation('/wallet')}
                className="w-11 h-11 flex items-center justify-center rounded-2xl glass transition-all duration-200"
                data-testid="button-wallet"
              >
                <Wallet className="w-5 h-5 text-foreground/80" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLocation('/notifications')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass transition-all duration-200"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-foreground/80" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setLocation('/settings')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass transition-all duration-200"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5 text-foreground/80" />
            </motion.button>
          </div>
        </motion.div>

        {userRole === 'tasker' ? (
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
        ) : (
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-5 px-5 scrollbar-hide" data-testid="carousel-promo-cards">
              {promoCategoryIds.map((categoryId, index) => {
                const category = TASK_CATEGORIES_WITH_SUBS[categoryId];
                const IconComponent = categoryIcons[categoryId];
                
                return (
                  <Link href="/post-task/1" key={categoryId}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative min-w-[140px] h-[160px] rounded-[24px] overflow-hidden cursor-pointer flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${category.colorHex}20, ${category.colorHex}10)`,
                      }}
                      data-testid={`card-promo-${categoryId}`}
                    >
                      <div 
                        className="absolute inset-0 backdrop-blur-xl"
                        style={{
                          background: `linear-gradient(135deg, ${category.colorHex}30, transparent)`,
                        }}
                      />
                      <div 
                        className="absolute inset-0 border rounded-[24px]"
                        style={{
                          borderColor: `${category.colorHex}40`,
                        }}
                      />
                      
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-40 rtl:left-0 rtl:right-auto"
                        style={{ backgroundColor: category.colorHex }}
                      />
                      
                      <div className="relative h-full p-4 flex flex-col justify-between">
                        <motion.div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.colorHex}30` }}
                          whileHover={{ rotate: 10 }}
                        >
                          <IconComponent 
                            className="w-6 h-6" 
                            style={{ color: category.colorHex }} 
                          />
                        </motion.div>
                        
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight mb-1">
                            {t(`tasks.categories.${categoryId}`)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {t('home.promoCards.findExpert')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
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

        {userRole === 'client' && (
          <motion.div variants={itemVariants}>
            <Link href="/post-task/1">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="w-full relative overflow-hidden rounded-[24px] mb-7"
                data-testid="button-post-task"
              >
                <div className="absolute inset-0 glass-premium" />
                <div className="absolute inset-0 gradient-border" />
                
                <div className="relative flex items-center justify-center gap-3.5 py-4 px-6">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <span className="text-base font-bold text-foreground">{t('home.postNewTask')}</span>
                  <Sparkles className="w-4 h-4 text-primary ms-auto" />
                </div>
              </motion.button>
            </Link>
          </motion.div>
        )}

        {userRole === 'client' && clientDirectRequests.length > 0 && (
          <>
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-4"
            >
              <h2 className="text-lg font-bold text-foreground">
                {i18n.language === 'ar' ? 'طلباتي المباشرة' : 'My Direct Requests'}
              </h2>
              <Link 
                href="/my-direct-requests"
                className="text-sm text-primary font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-300"
                data-testid="link-see-all-direct-requests"
              >
                {t('common.seeAll')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </motion.div>

            <motion.div variants={containerVariants} className="space-y-3 mb-7">
              {clientDirectRequests.map((request, index) => {
                const statusConfig = {
                  pending: { 
                    icon: Clock, 
                    color: 'text-warning', 
                    bgColor: 'bg-warning/10',
                    label: i18n.language === 'ar' ? 'قيد الانتظار' : 'Pending'
                  },
                  accepted: { 
                    icon: CheckCircle2, 
                    color: 'text-success', 
                    bgColor: 'bg-success/10',
                    label: i18n.language === 'ar' ? 'مقبول' : 'Accepted'
                  },
                  rejected: { 
                    icon: XCircle, 
                    color: 'text-destructive', 
                    bgColor: 'bg-destructive/10',
                    label: i18n.language === 'ar' ? 'مرفوض' : 'Rejected'
                  },
                  cancelled: { 
                    icon: XCircle, 
                    color: 'text-muted-foreground', 
                    bgColor: 'bg-muted/10',
                    label: i18n.language === 'ar' ? 'ملغي' : 'Cancelled'
                  },
                };
                const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = config.icon;
                const category = TASK_CATEGORIES_WITH_SUBS[request.category as keyof typeof TASK_CATEGORIES_WITH_SUBS];

                const linkHref = request.status === 'accepted' && request.linkedTaskId 
                  ? `/task/${request.linkedTaskId}` 
                  : '/my-direct-requests';

                return (
                  <motion.div
                    key={request.id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <Link href={linkHref}>
                      <motion.div
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass rounded-[20px] p-4 cursor-pointer"
                        data-testid={`card-direct-request-${request.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white/10">
                            <AvatarImage src={request.tasker?.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {request.tasker?.name?.charAt(0) || 'T'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-bold text-foreground truncate">
                                {request.tasker?.name || (i18n.language === 'ar' ? 'منفذ' : 'Tasker')}
                              </p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {request.title}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {category && (
                                <span 
                                  className="px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${category.colorHex}20`, color: category.colorHex }}
                                >
                                  {i18n.language === 'ar' ? category.nameAr : category.nameEn}
                                </span>
                              )}
                              <span className="font-semibold text-primary">
                                {request.budget} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </span>
                            </div>
                          </div>
                          
                          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-5"
        >
          <h2 className="text-lg font-bold text-foreground">
            {userRole === 'tasker' ? t('home.availableTasks') : t('home.yourTasks')}
          </h2>
          <Link 
            href={userRole === 'tasker' ? '/tasks-feed' : '/my-tasks'}
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
                  icon={userRole === 'tasker' ? <Search className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                  title={userRole === 'tasker' ? t('home.noTasksAvailable') : t('home.noTasksYet')}
                  description={userRole === 'tasker' 
                    ? t('home.checkBackLater') 
                    : t('home.postFirstTask')}
                  action={
                    userRole === 'client' && (
                      <Link href="/post-task/1">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {t('tasks.postTask')}
                        </motion.button>
                      </Link>
                    )
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
});

export default HomeScreen;
