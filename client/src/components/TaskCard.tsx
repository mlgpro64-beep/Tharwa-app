import { memo, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { MapPin, Clock, Heart, DollarSign, ChevronRight } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';
import { getCategoryInfo, TASK_CATEGORIES_WITH_SUBS } from '@shared/schema';
import { useTranslation } from 'react-i18next';

interface TaskCardProps {
  task: TaskWithDetails;
  showSaveButton?: boolean;
  index?: number;
}

export const TaskCard = memo(function TaskCard({ task, showSaveButton = true, index = 0 }: TaskCardProps) {
  const { savedTaskIds, toggleSavedTask } = useApp();
  const { i18n } = useTranslation();
  const isSaved = savedTaskIds.includes(task.id);
  const isArabic = i18n.language === 'ar';

  const categoryDisplay = useMemo(() => {
    const info = getCategoryInfo(task.category);
    if (!info) return task.category;
    
    if (info.subcategory) {
      return isArabic ? info.subcategory.nameAr : info.subcategory.nameEn;
    }
    
    const mainCat = TASK_CATEGORIES_WITH_SUBS[info.mainCategory];
    return isArabic ? mainCat.nameAr : mainCat.nameEn;
  }, [task.category, isArabic]);

  const categoryColor = useMemo(() => {
    const info = getCategoryInfo(task.category);
    if (!info) return '#6B7280';
    return TASK_CATEGORIES_WITH_SUBS[info.mainCategory]?.colorHex || '#6B7280';
  }, [task.category]);

  const handleToggleSave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedTask(task.id);
  }, [task.id, toggleSavedTask]);

  const formatCurrency = useCallback((amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }, []);

  const getStatusStyles = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'bg-success/15 text-success';
      case 'assigned': return 'bg-warning/15 text-warning';
      case 'in_progress': return 'bg-primary/15 text-primary';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/15 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  return (
    <Link href={`/task/${task.id}`} data-testid={`task-card-${task.id}`}>
      <motion.div 
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="glass rounded-[24px] p-5 relative cursor-pointer group"
      >
        {showSaveButton && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isSaved ? "Remove from saved" : "Save task"}
            onClick={handleToggleSave}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-sm z-10 transition-all"
            data-testid={`button-save-task-${task.id}`}
          >
            <Heart 
              className={cn(
                "w-[18px] h-[18px] transition-all duration-200",
                isSaved 
                  ? "fill-destructive text-destructive" 
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
          </motion.button>
        )}

        <div className="flex justify-between items-start mb-3 pr-10">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                }}
              >
                {categoryDisplay}
              </span>
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                getStatusStyles(task.status)
              )}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground leading-snug pr-2">
              {task.title}
            </h3>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary/70" />
              <span className="max-w-[90px] truncate font-medium">{task.distance || task.location}</span>
            </div>
            <span className="text-muted-foreground/30">|</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary/70" />
              <span className="font-medium">{task.time}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-bold text-base text-primary">
              <DollarSign className="w-4 h-4" />
              <span>{formatCurrency(task.budget).replace('$', '')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
});
