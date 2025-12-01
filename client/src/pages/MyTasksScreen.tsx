import { useState } from 'react';
import { Link } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TaskWithDetails } from '@shared/schema';

type TabType = 'all' | 'open' | 'in_progress' | 'completed';

export default function MyTasksScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/my'],
  });

  const filteredTasks = tasks?.filter(task => {
    if (activeTab === 'all') return true;
    return task.status === activeTab;
  }) || [];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  const getTaskCount = (status: TabType) => {
    if (status === 'all') return tasks?.length || 0;
    return tasks?.filter(t => t.status === status).length || 0;
  };

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">My Tasks</h1>
          <Link href="/post-task/1">
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-90 transition-all"
              data-testid="button-add-task"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`button-tab-${tab.id}`}
              className={cn(
                "px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all active:scale-95 flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                activeTab === tab.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted"
              )}>
                {getTaskCount(tab.id)}
              </span>
            </button>
          ))}
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
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} showSaveButton={false} />
          ))
        ) : (
          <div className="bg-card p-8 rounded-3xl border border-border text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">
                {activeTab === 'all' ? 'add_task' : 'filter_list_off'}
              </span>
            </div>
            <h3 className="font-bold text-foreground mb-2">
              {activeTab === 'all' ? 'No tasks yet' : `No ${activeTab.replace('_', ' ')} tasks`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeTab === 'all' 
                ? 'Post your first task to get started' 
                : 'Tasks will appear here when they match this filter'}
            </p>
            {activeTab === 'all' && (
              <Link href="/post-task/1">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all">
                  Post a Task
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Screen>
  );
}
