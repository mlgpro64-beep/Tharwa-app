import { memo, useCallback } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { MapPin, Clock, Heart, DollarSign } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

interface TaskCardProps {
  task: TaskWithDetails;
  showSaveButton?: boolean;
  index?: number;
}

export const TaskCard = memo(function TaskCard({ task, showSaveButton = true, index = 0 }: TaskCardProps) {
  const { savedTaskIds, toggleSavedTask } = useApp();
  const isSaved = savedTaskIds.includes(task.id);

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
      case 'open': return 'bg-success/15 text-success border-success/20';
      case 'assigned': return 'bg-warning/15 text-warning border-warning/20';
      case 'in_progress': return 'bg-primary/15 text-primary border-primary/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/15 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Link href={`/task/${task.id}`} data-testid={`task-card-${task.id}`}>
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="glass rounded-3xl p-6 relative cursor-pointer group transition-all duration-300 hover:shadow-xl"
        >
          {showSaveButton && (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isSaved ? "Remove from saved" : "Save task"}
              onClick={handleToggleSave}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl glass-button z-10"
              data-testid={`button-save-task-${task.id}`}
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isSaved 
                    ? "fill-destructive text-destructive scale-110" 
                    : "text-muted-foreground"
                )}
              />
            </motion.button>
          )}

          <div className="flex justify-between items-start mb-4 pr-12">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                  {task.category}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  getStatusStyles(task.status)
                )}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground leading-tight pr-4">
                {task.title}
              </h3>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm mb-6 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 text-xs font-medium text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[80px] truncate">{task.distance || task.location}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 text-xs font-medium text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {task.time}
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-extrabold text-lg text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
              <DollarSign className="w-4 h-4" />
              {formatCurrency(task.budget).replace('$', '')}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
});
