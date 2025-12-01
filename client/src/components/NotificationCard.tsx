import { cn } from '@/lib/utils';
import type { Notification } from '@shared/schema';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'offer': return 'local_offer';
      case 'chat': return 'chat';
      case 'task_update': return 'task_alt';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'offer': return 'bg-primary/10 text-primary';
      case 'chat': return 'bg-success/10 text-success';
      case 'task_update': return 'bg-warning/10 text-warning';
      case 'system': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer active:scale-[0.99]",
        notification.read 
          ? "bg-transparent" 
          : "bg-primary/5 border border-primary/10"
      )}
      onClick={() => !notification.read && onMarkRead?.(notification.id)}
      data-testid={`notification-card-${notification.id}`}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", getTypeColor(notification.type))}>
        <span className="material-symbols-outlined">
          {notification.icon || getTypeIcon(notification.type)}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "font-bold text-foreground",
            !notification.read && "text-primary"
          )}>
            {notification.title}
          </h4>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        <span className="text-xs text-muted-foreground mt-2 block">
          {formatTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );
}
