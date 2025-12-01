import { Link, useParams } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@shared/schema';

export default function ProfileScreen() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, userRole } = useApp();
  
  const isOwnProfile = !userId;
  
  const { data: profileUser, isLoading } = useQuery<User>({
    queryKey: ['/api/users', userId || 'me'],
  });

  const user = profileUser || currentUser;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = [
    { 
      label: 'Rating', 
      value: user?.rating ? parseFloat(String(user.rating)).toFixed(1) : '0.0',
      icon: 'star',
      color: 'text-warning'
    },
    { 
      label: 'Completed', 
      value: user?.completedTasks || 0,
      icon: 'task_alt',
      color: 'text-success'
    },
    { 
      label: 'Member Since', 
      value: user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear(),
      icon: 'calendar_month',
      color: 'text-primary'
    },
  ];

  if (isLoading) {
    return (
      <Screen className="px-6">
        <div className="py-4">
          <div className="flex items-center justify-center mb-8">
            <Skeleton className="w-24 h-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          {!isOwnProfile && (
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
              data-testid="button-back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-foreground">
            {isOwnProfile ? 'Profile' : 'User Profile'}
          </h1>
          {isOwnProfile && (
            <Link href="/settings">
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
                data-testid="button-settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </Link>
          )}
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24 border-4 border-border">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <Link href="/profile/edit">
                <button 
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                  data-testid="button-edit-profile"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </Link>
            )}
          </div>
          
          <h2 className="text-2xl font-extrabold text-foreground mb-1">{user?.name || 'Guest'}</h2>
          <p className="text-muted-foreground mb-2">@{user?.username || 'guest'}</p>
          
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
            userRole === 'tasker' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
          )}>
            {userRole === 'tasker' ? 'Tasker' : 'Client'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card p-4 rounded-2xl border border-border text-center">
              <span className={cn("material-symbols-outlined text-2xl mb-2 block", stat.color)}>
                {stat.icon}
              </span>
              <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {user?.bio && (
          <div className="bg-card p-4 rounded-2xl border border-border mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
            <p className="text-foreground">{user.bio}</p>
          </div>
        )}

        {user?.location && (
          <div className="bg-card p-4 rounded-2xl border border-border mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">location_on</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="font-bold text-foreground">{user.location}</p>
              </div>
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="space-y-3">
            <Link href="/profile/edit">
              <button 
                className="w-full h-14 bg-card border border-border rounded-2xl font-bold flex items-center justify-between px-4 hover:bg-muted transition-all active:scale-[0.99]"
                data-testid="button-edit-profile-full"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Edit Profile
                </div>
                <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
              </button>
            </Link>

            <Link href="/my-tasks">
              <button 
                className="w-full h-14 bg-card border border-border rounded-2xl font-bold flex items-center justify-between px-4 hover:bg-muted transition-all active:scale-[0.99]"
                data-testid="button-my-tasks"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">list_alt</span>
                  {userRole === 'tasker' ? 'My Jobs' : 'My Tasks'}
                </div>
                <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
              </button>
            </Link>

            <Link href="/help">
              <button 
                className="w-full h-14 bg-card border border-border rounded-2xl font-bold flex items-center justify-between px-4 hover:bg-muted transition-all active:scale-[0.99]"
                data-testid="button-help"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">help</span>
                  Help Center
                </div>
                <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
              </button>
            </Link>
          </div>
        )}
      </div>
    </Screen>
  );
}
