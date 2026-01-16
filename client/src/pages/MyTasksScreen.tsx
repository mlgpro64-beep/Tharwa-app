import React, { useState, memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { Plus, ClipboardList, Filter } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

type TabType = 'all' | 'open' | 'in_progress' | 'completed';

const MyTasksScreen = memo(function MyTasksScreen() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const isAuthenticated = !!localStorage.getItem('userId');
  const userId = localStorage.getItem('userId');

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MyTasksScreen.tsx:18',message:'MyTasksScreen mounted',data:{userId,isAuthenticated,activeTab,timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'}})}).catch(()=>{});
  }, []);
  // #endregion

  const { data: tasks, isLoading, error } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/my'],
    enabled: isAuthenticated,
    onSuccess: (data) => {
      // #region agent log
      console.log('[DEBUG] MyTasksScreen - tasks received', { tasksCount: data?.length, taskIds: data?.map(t=>t.id), taskStatuses: data?.map(t=>({id:t.id,status:t.status,taskerId:t.taskerId,clientId:t.clientId})) });
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MyTasksScreen.tsx:28',message:'My tasks query - success',data:{userId,tasksCount:data?.length,taskIds:data?.map(t=>t.id),taskStatuses:data?.map(t=>({id:t.id,status:t.status,taskerId:t.taskerId,clientId:t.clientId})),timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'}})}).catch(()=>{});
      // #endregion
    },
    onError: (error) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MyTasksScreen.tsx:33',message:'My tasks query - error',data:{userId,error:error?.message,timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'}})}).catch(()=>{});
      // #endregion
    },
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (activeTab === 'all') return tasks;
    // Include both "assigned" and "in_progress" tasks in the "in_progress" tab
    if (activeTab === 'in_progress') {
      const filtered = tasks.filter(task => task.status === 'in_progress' || task.status === 'assigned');
      // #region agent log
      console.log('[DEBUG] MyTasksScreen - filtered in_progress tasks', { totalTasks: tasks.length, filteredCount: filtered.length, filteredTaskIds: filtered.map(t=>t.id), allTaskStatuses: tasks.map(t=>({id:t.id,status:t.status,taskerId:t.taskerId})) });
      // #endregion
      return filtered;
    }
    return tasks.filter(task => task.status === activeTab);
  }, [tasks, activeTab]);

  const tabs = useMemo(() => [
    { id: 'all' as TabType, label: 'All' },
    { id: 'open' as TabType, label: 'Open' },
    { id: 'in_progress' as TabType, label: 'In Progress' },
    { id: 'completed' as TabType, label: 'Completed' },
  ], []);

  const getTaskCount = useCallback((status: TabType) => {
    if (!tasks) return 0;
    if (status === 'all') return tasks.length;
    // Include both "assigned" and "in_progress" tasks in the count for "in_progress" tab
    if (status === 'in_progress') {
      return tasks.filter(t => t.status === 'in_progress' || t.status === 'assigned').length;
    }
    return tasks.filter(t => t.status === status).length;
  }, [tasks]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-safe pb-24 flex items-center justify-center">
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="Something went wrong"
          description="We couldn't load your tasks. Please try again."
          action={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 gradient-primary text-white rounded-xl font-bold"
            >
              Retry
            </motion.button>
          }
        />
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
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-extrabold text-foreground">My Tasks</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation('/post-task/1')}
            className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30"
            data-testid="button-add-task"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 mb-6"
        >
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`button-tab-${tab.id}`}
              className={cn(
                "px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "gradient-primary text-white shadow-lg shadow-primary/25"
                  : "glass text-muted-foreground"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                activeTab === tab.id
                  ? "bg-white/20"
                  : "bg-muted"
              )}>
                {getTaskCount(tab.id)}
              </span>
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TaskCardSkeleton count={3} />
            </motion.div>
          ) : filteredTasks.length > 0 ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard task={task} showSaveButton={false} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={activeTab === 'all' ? <ClipboardList className="w-8 h-8" /> : <Filter className="w-8 h-8" />}
                title={activeTab === 'all' ? 'No tasks yet' : `No ${activeTab.replace('_', ' ')} tasks`}
                description={
                  activeTab === 'all' 
                    ? 'Post your first task to get started' 
                    : 'Tasks will appear here when they match this filter'
                }
                action={
                  activeTab === 'all' ? (
                    <Link href="/post-task/1">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 gradient-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25"
                      >
                        Post a Task
                      </motion.button>
                    </Link>
                  ) : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default MyTasksScreen;
