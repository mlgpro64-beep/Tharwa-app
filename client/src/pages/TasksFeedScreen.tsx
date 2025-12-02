import { useState, memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { TaskCardSkeleton, EmptyState } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES_WITH_SUBS, getCategoryInfo, type TaskCategoryId } from '@shared/schema';
import { Search, SearchX, X, Filter } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

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
  const isArabic = i18n.language === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available', selectedCategory],
  });

  const filteredTasks = useMemo(() => {
    return tasks?.filter(task => {
      if (!selectedCategory) return true;
      
      const taskCatInfo = getCategoryInfo(task.category);
      const matchesCategory = taskCatInfo?.mainCategory === selectedCategory;
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
              {taskCount} {t('tasks.available')}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative mb-5"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground rtl:right-4 rtl:left-auto" />
          <input
            type="search"
            placeholder={`${t('common.search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-13 ps-12 pe-12 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all text-base"
            data-testid="input-search-tasks"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted/80 hover:bg-muted transition-colors rtl:left-4 rtl:right-auto"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('tasks.category')}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategorySelect(null)}
              data-testid="button-category-all"
              className={cn(
                "px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200",
                selectedCategory === null
                  ? "gradient-primary text-white shadow-lg shadow-primary/25"
                  : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              {t('tasks.filters.allCategories')}
            </motion.button>
            {(Object.entries(TASK_CATEGORIES_WITH_SUBS) as [TaskCategoryId, typeof TASK_CATEGORIES_WITH_SUBS[TaskCategoryId]][]).map(([categoryId, category]) => {
              const displayName = isArabic ? category.nameAr : category.nameEn;
              const colorHex = category.colorHex || '#6B7280';
              
              return (
                <motion.button
                  key={categoryId}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategorySelect(categoryId)}
                  data-testid={`button-filter-${categoryId}`}
                  className={cn(
                    "px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200",
                    selectedCategory === categoryId
                      ? "text-white shadow-lg"
                      : "glass text-muted-foreground hover:text-foreground"
                  )}
                  style={{
                    background: selectedCategory === categoryId 
                      ? `linear-gradient(135deg, ${colorHex} 0%, ${colorHex}CC 100%)`
                      : undefined,
                    boxShadow: selectedCategory === categoryId 
                      ? `0 8px 20px -8px ${colorHex}60`
                      : undefined,
                  }}
                >
                  {displayName}
                </motion.button>
              );
            })}
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
                  (searchQuery || selectedCategory) && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
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
