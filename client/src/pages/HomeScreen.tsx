import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { TaskCard } from '@/components/TaskCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { Bell, Settings, Wallet, Plus, ArrowRight, TrendingUp, CheckCircle, Search } from 'lucide-react';
import type { TaskWithDetails, User } from '@shared/schema';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-primary/15 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.2 }}
          className="absolute top-40 -left-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {userRole === 'tasker' ? 'Welcome back' : 'Hello'}
            </p>
            <h1 className="text-2xl font-extrabold text-foreground">
              {displayUser?.name || 'Guest'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation('/notifications')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation('/settings')}
              className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/wallet">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="gradient-primary p-6 rounded-3xl text-white mb-6 shadow-2xl shadow-primary/30 cursor-pointer relative overflow-hidden"
              data-testid="card-wallet-balance"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              
              <div className="flex items-center justify-between mb-6 relative">
                <div>
                  <p className="text-sm opacity-80 font-medium mb-1">Available Balance</p>
                  <p className="text-4xl font-extrabold tracking-tight">
                    $<CountUp end={balance} decimals={2} />
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm opacity-90 font-medium relative">
                <span>Tap to manage wallet</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {userRole === 'tasker' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-premium rounded-3xl p-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <p className="text-3xl font-extrabold text-foreground mb-1">
                $<CountUp end={stats?.earnings || 0} decimals={0} />
              </p>
              <p className="text-sm text-muted-foreground font-medium">Total Earnings</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-premium rounded-3xl p-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-extrabold text-foreground mb-1">
                <CountUp end={stats?.jobsDone || 0} decimals={0} />
              </p>
              <p className="text-sm text-muted-foreground font-medium">Jobs Completed</p>
            </motion.div>
          </motion.div>
        )}

        {userRole === 'client' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/post-task/1">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-16 glass-premium rounded-3xl font-bold flex items-center justify-center gap-3 mb-8 gradient-border text-primary"
                data-testid="button-post-task"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span>Post a New Task</span>
              </motion.button>
            </Link>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-bold text-foreground">
            {userRole === 'tasker' ? 'Available Tasks' : 'Your Tasks'}
          </h2>
          <Link 
            href={userRole === 'tasker' ? '/tasks-feed' : '/my-tasks'}
            className="text-sm text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {tasksLoading ? (
              <TaskCardSkeleton count={3} />
            ) : recentTasks.length > 0 ? (
              recentTasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
              ))
            ) : (
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
                      >
                        Post a Task
                      </motion.button>
                    </Link>
                  )
                }
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default HomeScreen;
