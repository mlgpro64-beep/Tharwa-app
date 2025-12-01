import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { TaskCard } from '@/components/TaskCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { Bell, Settings, Wallet, Plus, ArrowRight, TrendingUp, CheckCircle, Search, Sparkles } from 'lucide-react';
import type { TaskWithDetails, User } from '@shared/schema';

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

const HomeScreen = memo(function HomeScreen() {
  const [, setLocation] = useLocation();
  const { userRole, user } = useApp();

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

  const displayUser = currentUser || user;
  const balance = useMemo(() => 
    displayUser?.balance ? parseFloat(String(displayUser.balance)) : 0,
    [displayUser?.balance]
  );
  const recentTasks = useMemo(() => tasks?.slice(0, 3) || [], [tasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute top-60 -left-24 w-56 h-56 bg-gradient-to-tr from-accent/25 to-accent/5 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute bottom-40 right-10 w-40 h-40 bg-gradient-to-tl from-primary/15 to-transparent rounded-full blur-2xl"
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
              {displayUser?.name || 'Guest'}
            </motion.h1>
          </div>
          <div className="flex items-center gap-2.5">
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
              </div>
              
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-60" />
              
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-sm text-white/70 font-medium mb-1.5">Available Balance</p>
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
                  <span>Tap to manage wallet</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {userRole === 'tasker' && (
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-3 mb-7"
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
              <p className="text-xs text-muted-foreground font-medium">Total Earnings</p>
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
              <p className="text-xs text-muted-foreground font-medium">Jobs Completed</p>
            </motion.div>
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
                  <span className="text-base font-bold text-foreground">Post a New Task</span>
                  <Sparkles className="w-4 h-4 text-primary ml-auto" />
                </div>
              </motion.button>
            </Link>
          </motion.div>
        )}

        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-5"
        >
          <h2 className="text-lg font-bold text-foreground">
            {userRole === 'tasker' ? 'Available Tasks' : 'Your Tasks'}
          </h2>
          <Link 
            href={userRole === 'tasker' ? '/tasks-feed' : '/my-tasks'}
            className="text-sm text-primary font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all duration-300"
            data-testid="link-see-all-tasks"
          >
            See all
            <ArrowRight className="w-4 h-4" />
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
                  title={userRole === 'tasker' ? 'No tasks available' : 'No tasks yet'}
                  description={userRole === 'tasker' 
                    ? 'Check back later for new opportunities' 
                    : 'Post your first task to get started'}
                  action={
                    userRole === 'client' && (
                      <Link href="/post-task/1">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Post a Task
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
