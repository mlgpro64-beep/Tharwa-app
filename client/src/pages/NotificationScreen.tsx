import { Screen } from '@/components/layout/Screen';
import { NotificationCard } from '@/components/NotificationCard';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@shared/schema';

export default function NotificationScreen() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
              data-testid="button-back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-sm text-primary font-bold active:opacity-70 transition-opacity"
              data-testid="button-mark-all-read"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="px-6 space-y-2 pb-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl">
                <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))
        ) : (
          <div className="bg-card p-8 rounded-3xl border border-border text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">notifications_off</span>
            </div>
            <h3 className="font-bold text-foreground mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
