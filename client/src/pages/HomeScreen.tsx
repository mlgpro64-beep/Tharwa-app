import { Link } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { TaskCard } from '@/components/TaskCard';
import { CountUp } from '@/components/CountUp';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskWithDetails, User } from '@shared/schema';

export default function HomeScreen() {
  const { userRole, user } = useApp();

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: !!localStorage.getItem('userId'),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks', userRole === 'tasker' ? 'available' : 'my'],
  });

  const { data: stats } = useQuery<{ earnings: number; jobsDone: number }>({
    queryKey: ['/api/stats'],
    enabled: userRole === 'tasker',
  });

  const displayUser = currentUser || user;
  const balance = displayUser?.balance ? parseFloat(String(displayUser.balance)) : 0;
  const recentTasks = tasks?.slice(0, 3) || [];

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {userRole === 'tasker' ? 'Welcome back' : 'Hello'}
            </p>
            <h1 className="text-2xl font-extrabold text-foreground">
              {displayUser?.name || 'Guest'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications">
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
                data-testid="button-notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </Link>
            <Link href="/settings">
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
                data-testid="button-settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </Link>
          </div>
        </div>

        <Link href="/wallet">
          <div 
            className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-3xl text-primary-foreground mb-6 shadow-lg shadow-primary/25 active:scale-[0.99] transition-all cursor-pointer"
            data-testid="card-wallet-balance"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-80 font-medium">Available Balance</p>
                <p className="text-3xl font-extrabold">
                  $<CountUp end={balance} decimals={2} />
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-80">
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
              Tap to manage wallet
            </div>
          </div>
        </Link>

        {userRole === 'tasker' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-success">payments</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                $<CountUp end={stats?.earnings || 0} decimals={0} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Total Earnings</p>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">task_alt</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                <CountUp end={stats?.jobsDone || 0} decimals={0} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Jobs Completed</p>
            </div>
          </div>
        )}

        {userRole === 'client' && (
          <Link href="/post-task/1">
            <button 
              className="w-full h-14 bg-card border-2 border-dashed border-primary/30 text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all mb-6"
              data-testid="button-post-task"
            >
              <span className="material-symbols-outlined">add</span>
              Post a New Task
            </button>
          </Link>
        )}
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {userRole === 'tasker' ? 'Available Tasks' : 'Your Tasks'}
          </h2>
          <Link 
            href={userRole === 'tasker' ? '/tasks-feed' : '/my-tasks'}
            className="text-sm text-primary font-bold"
          >
            See all
          </Link>
        </div>

        <div className="space-y-4 pb-4">
          {tasksLoading ? (
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
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="bg-card p-8 rounded-3xl border border-border text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-muted-foreground">
                  {userRole === 'tasker' ? 'search' : 'add_task'}
                </span>
              </div>
              <h3 className="font-bold text-foreground mb-2">
                {userRole === 'tasker' ? 'No tasks available' : 'No tasks yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'tasker' 
                  ? 'Check back later for new opportunities' 
                  : 'Post your first task to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
