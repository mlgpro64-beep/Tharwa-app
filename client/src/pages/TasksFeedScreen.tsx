import { useState, memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import { Search, SearchX, X } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';
import { useApp } from '@/context/AppContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
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

const TasksFeedScreen = memo(function TasksFeedScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { userRole } = useApp();
  const isArabic = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'my_tasks'>('available');
  const isAuthenticated = !!localStorage.getItem('userId');
  const isTasker = userRole === 'tasker';

  const { data: availableTasks, isLoading: isLoadingAvailable } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available'],
    enabled: isAuthenticated && activeTab === 'available',
  });

  const { data: myTasks, isLoading: isLoadingMyTasks } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/my'],
    enabled: isAuthenticated && activeTab === 'my_tasks' && isTasker,
  });

  const tasks = activeTab === 'available' ? availableTasks : myTasks;
  const isLoading = activeTab === 'available' ? isLoadingAvailable : isLoadingMyTasks;

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Filter by tab
    let tabFiltered = tasks;
    if (activeTab === 'my_tasks' && isTasker) {
      // Show only in_progress and assigned tasks for tasker
      tabFiltered = tasks.filter(task => 
        task.taskerId === localStorage.getItem('userId') && 
        (task.status === 'in_progress' || task.status === 'assigned')
      );
    }
    
    // Filter by search
    return tabFiltered.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, searchQuery, activeTab, isTasker]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const taskCount = filteredTasks.length;

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-32 -left-24 w-72 h-72 bg-gradient-to-br from-accent/25 to-accent/5 rounded-full blur-3xl rtl:-right-24 rtl:left-auto"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute bottom-60 -right-16 w-48 h-48 bg-gradient-to-tl from-primary/20 to-transparent rounded-full blur-3xl rtl:-left-16 rtl:right-auto"
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
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t('tasks.feed')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {taskCount} {activeTab === 'available' ? t('tasks.available') : (isArabic ? 'مهام جارية' : 'In Progress')}
            </p>
          </div>
        </motion.div>

        {isTasker && (
          <motion.div
            variants={itemVariants}
            className="flex gap-2 mb-5"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('available')}
              className={cn(
                "px-5 py-2.5 rounded-2xl font-bold text-sm transition-all",
                activeTab === 'available'
                  ? "gradient-primary text-white shadow-lg shadow-primary/25"
                  : "glass text-muted-foreground"
              )}
            >
              {isArabic ? 'المتاحة' : 'Available'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('my_tasks')}
              className={cn(
                "px-5 py-2.5 rounded-2xl font-bold text-sm transition-all",
                activeTab === 'my_tasks'
                  ? "gradient-primary text-white shadow-lg shadow-primary/25"
                  : "glass text-muted-foreground"
              )}
            >
              {isArabic ? 'مهامي الجارية' : 'My Tasks'}
            </motion.button>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="relative mb-5"
        >
          <div className="liquid-glass-search rounded-[1.25rem] overflow-hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 rtl:right-4 rtl:left-auto z-10" />
            <input
              type="search"
              placeholder={`${t('common.search')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 ps-12 pe-12 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-base font-medium"
              data-testid="input-search-tasks"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors rtl:left-4 rtl:right-auto z-10"
                >
                  <X className="w-3.5 h-3.5 text-white/60" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </motion.div>

      <div className="relative z-10 px-5">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TaskCardSkeleton count={4} />
            </motion.div>
          ) : filteredTasks.length > 0 ? (
            <motion.div
              key="tasks"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {filteredTasks.map((task, index) => (
                <motion.div key={task.id} variants={itemVariants}>
                  <TaskCard task={task} index={index} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmptyState
                icon={<SearchX className="w-8 h-8" />}
                title={t('tasks.empty.title')}
                  description={t('tasks.empty.description')}
                action={
                  searchQuery && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSearchQuery('');
                      }}
                      className="glass-premium text-foreground px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {t('common.filter')}
                    </motion.button>
                  )
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default TasksFeedScreen;
