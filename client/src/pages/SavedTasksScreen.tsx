import { memo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { ArrowLeft, Heart } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

const SavedTasksScreen = memo(function SavedTasksScreen() {
  const [, setLocation] = useLocation();
  const { savedTaskIds } = useApp();

  const { data: savedTasks, isLoading, error } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/saved', savedTaskIds],
    enabled: savedTaskIds.length > 0,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-safe pb-24 flex items-center justify-center">
        <EmptyState
          icon={<Heart className="w-8 h-8" />}
          title="Something went wrong"
          description="We couldn't load your saved tasks. Please try again."
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
          className="flex items-center gap-4 mb-8"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-2xl font-extrabold text-foreground">Saved Tasks</h1>
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
          ) : savedTasks && savedTasks.length > 0 ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {savedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard task={task} />
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
                icon={<Heart className="w-8 h-8" />}
                title="No saved tasks"
                description="Save tasks you're interested in to view them later"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default SavedTasksScreen;
