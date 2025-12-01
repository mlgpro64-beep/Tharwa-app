import { Link } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ConversationPreview } from '@shared/schema';

export default function ConversationsScreen() {
  const { data: conversations, isLoading } = useQuery<ConversationPreview[]>({
    queryKey: ['/api/conversations'],
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Screen className="px-0">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Messages</h1>
      </div>

      <div className="px-6 space-y-2 pb-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl">
                <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </>
        ) : conversations && conversations.length > 0 ? (
          conversations.map((conv) => (
            <Link key={conv.taskId} href={`/chat/${conv.taskId}`}>
              <div 
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-card active:scale-[0.99] cursor-pointer border border-transparent",
                  conv.unreadCount > 0 && "bg-primary/5 border-primary/20"
                )}
                data-testid={`conversation-${conv.taskId}`}
              >
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-border">
                    <AvatarImage src={conv.otherUser?.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {conv.otherUser?.name ? getInitials(conv.otherUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      "font-bold text-foreground truncate",
                      conv.unreadCount > 0 && "text-foreground"
                    )}>
                      {conv.otherUser?.name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {conv.lastMessage?.createdAt && formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {conv.taskTitle}
                  </p>
                  <p className={cn(
                    "text-sm truncate",
                    conv.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"
                  )}>
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-card p-8 rounded-3xl border border-border text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">forum</span>
            </div>
            <h3 className="font-bold text-foreground mb-2">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              Start chatting with clients or taskers about tasks
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
