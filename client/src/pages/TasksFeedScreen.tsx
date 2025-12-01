import { useState, memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES } from '@shared/schema';
import { Map, Search, SearchX, X } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

const TasksFeedScreen = memo(function TasksFeedScreen() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available', selectedCategory],
  });

  const filteredTasks = useMemo(() => {
    return tasks?.filter(task => {
      const matchesCategory = !selectedCategory || task.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];
  }, [tasks, selectedCategory, searchQuery]);

  const handleCategorySelect = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-extrabold text-foreground">Browse Tasks</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation('/map')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-map-view"
          >
            <Map className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-12 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            data-testid="input-search-tasks"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-muted"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategorySelect(null)}
            data-testid="button-category-all"
            className={cn(
              "px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
              selectedCategory === null
                ? "gradient-primary text-white shadow-lg shadow-primary/25"
                : "glass text-muted-foreground"
            )}
          >
            All
          </motion.button>
          {TASK_CATEGORIES.map((category) => (
            <motion.button
              key={category}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(category)}
              data-testid={`button-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
                selectedCategory === category
                  ? "gradient-primary text-white shadow-lg shadow-primary/25"
                  : "glass text-muted-foreground"
              )}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10 px-6 space-y-4">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredTasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
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
                icon={<SearchX className="w-8 h-8" />}
                title="No tasks found"
                description={searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'No tasks available in this category'}
                action={
                  (searchQuery || selectedCategory) && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                      }}
                      className="glass text-foreground px-6 py-3 rounded-2xl font-bold"
                    >
                      Clear Filters
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
