import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tag, MessageCircle, CheckCircle2, Info, Bell } from 'lucide-react';
import type { Notification } from '@shared/schema';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export const NotificationCard = memo(function NotificationCard({ 
  notification, 
  onMarkRead 
}: NotificationCardProps) {
  const formatTime = useCallback((date: Date | string) => {
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
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'offer': return Tag;
      case 'chat': return MessageCircle;
      case 'task_update': return CheckCircle2;
      case 'system': return Info;
      default: return Bell;
    }
  }, []);

  const getTypeStyles = useCallback((type: string) => {
    switch (type) {
      case 'offer': return 'bg-primary/15 text-primary';
      case 'chat': return 'bg-success/15 text-success';
      case 'task_update': return 'bg-warning/15 text-warning';
      case 'system': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  const Icon = getTypeIcon(notification.type);

  const handleClick = useCallback(() => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  }, [notification.read, notification.id, onMarkRead]);

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer",
        notification.read 
          ? "glass" 
          : "glass-premium gradient-border"
      )}
      onClick={handleClick}
      data-testid={`notification-card-${notification.id}`}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
        getTypeStyles(notification.type)
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "font-bold",
            !notification.read ? "text-primary" : "text-foreground"
          )}>
            {notification.title}
          </h4>
          {!notification.read && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 rounded-full gradient-primary flex-shrink-0 mt-1.5 shadow-lg shadow-primary/30"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        <span className="text-xs text-muted-foreground mt-2 block font-medium">
          {formatTime(notification.createdAt)}
        </span>
      </div>
    </motion.div>
  );
});
