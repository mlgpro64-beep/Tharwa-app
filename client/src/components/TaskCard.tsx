import { Link } from 'wouter';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { TaskWithDetails } from '@shared/schema';

interface TaskCardProps {
  task: TaskWithDetails;
  showSaveButton?: boolean;
}

export function TaskCard({ task, showSaveButton = true }: TaskCardProps) {
  const { savedTaskIds, toggleSavedTask } = useApp();
  const isSaved = savedTaskIds.includes(task.id);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedTask(task.id);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-success/10 text-success';
      case 'assigned': return 'bg-warning/10 text-warning';
      case 'in_progress': return 'bg-primary/10 text-primary';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Link href={`/task/${task.id}`} data-testid={`task-card-${task.id}`}>
      <div className="bg-card shadow-sm overflow-hidden cursor-pointer group p-6 relative transition-all duration-300 hover:shadow-lg border border-transparent hover:border-border active:scale-[0.99] rounded-3xl">
        {showSaveButton && (
          <button 
            aria-label={isSaved ? "Remove from saved" : "Save task"}
            onClick={handleToggleSave}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-all z-10 active:scale-75 duration-300"
            data-testid={`button-save-task-${task.id}`}
          >
            <span 
              className={cn(
                "material-symbols-outlined text-[22px] transition-all duration-300",
                isSaved 
                  ? "material-symbols-filled text-destructive scale-110" 
                  : "text-muted-foreground"
              )}
            >
              favorite
            </span>
          </button>
        )}

        <div className="flex justify-between items-start mb-3 pr-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {task.category}
              </span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", getStatusColor(task.status))}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground leading-tight">{task.title}</h3>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl transition-colors group-hover:bg-muted/80">
              <span className="material-symbols-outlined text-base text-primary">location_on</span>
              {task.distance || task.location}
            </div>
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl transition-colors group-hover:bg-muted/80">
              <span className="material-symbols-outlined text-base text-primary">schedule</span>
              {task.time}
            </div>
          </div>
          <div className="font-extrabold text-lg text-primary bg-primary/5 px-3 py-1 rounded-lg">
            {formatCurrency(task.budget)}
          </div>
        </div>
      </div>
    </Link>
  );
}
