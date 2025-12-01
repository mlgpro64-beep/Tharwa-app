import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskWithDetails } from '@shared/schema';

export default function SavedTasksScreen() {
  const { savedTaskIds } = useApp();

  const { data: savedTasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/saved', savedTaskIds],
    enabled: savedTaskIds.length > 0,
  });

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
            data-testid="button-back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-extrabold text-foreground">Saved Tasks</h1>
        </div>
      </div>

      <div className="px-6 space-y-4 pb-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-6 rounded-3xl border border-border">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-20 rounded-xl" />
                    <Skeleton className="h-8 w-20 rounded-xl" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </>
        ) : savedTasks && savedTasks.length > 0 ? (
          savedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <div className="bg-card p-8 rounded-3xl border border-border text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">favorite_border</span>
            </div>
            <h3 className="font-bold text-foreground mb-2">No saved tasks</h3>
            <p className="text-sm text-muted-foreground">
              Save tasks you're interested in to view them later
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
