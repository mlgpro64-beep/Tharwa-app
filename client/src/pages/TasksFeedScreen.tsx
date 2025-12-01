import { useState } from 'react';
import { Link } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { TaskCard } from '@/components/TaskCard';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES } from '@shared/schema';
import type { TaskWithDetails } from '@shared/schema';

export default function TasksFeedScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks/available', selectedCategory],
  });

  const filteredTasks = tasks?.filter(task => {
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">Browse Tasks</h1>
          <Link href="/map">
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
              data-testid="button-map-view"
            >
              <span className="material-symbols-outlined">map</span>
            </button>
          </Link>
        </div>

        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            search
          </span>
          <input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            data-testid="input-search-tasks"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          <button
            onClick={() => setSelectedCategory(null)}
            data-testid="button-category-all"
            className={cn(
              "px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all active:scale-95",
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            )}
          >
            All
          </button>
          {TASK_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              data-testid={`button-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all active:scale-95",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4 pb-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
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
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <div className="bg-card p-8 rounded-3xl border border-border text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">search_off</span>
            </div>
            <h3 className="font-bold text-foreground mb-2">No tasks found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'No tasks available in this category'}
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
