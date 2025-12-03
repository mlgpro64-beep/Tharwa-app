import { memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import type { ConversationPreview } from '@shared/schema';

const ConversationsScreen = memo(function ConversationsScreen() {
  const [, setLocation] = useLocation();
  const isAuthenticated = !!localStorage.getItem('userId');
  
  const { data: conversations, isLoading, error } = useQuery<ConversationPreview[]>({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
  });

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const formatTime = useCallback((date: Date | string) => {
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
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-safe pb-24 flex items-center justify-center">
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="Something went wrong"
          description="We couldn't load your messages. Please try again."
          action={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 gradient-primary text-white rounded-xl font-bold"
            >
              Retry
            </motion.button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-40 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation('/home')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-2xl font-extrabold text-foreground">Messages</h1>
        </motion.div>

        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 glass rounded-2xl">
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
              </motion.div>
            ) : conversations && conversations.length > 0 ? (
              <motion.div
                key="conversations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {conversations.map((conv, index) => (
                  <motion.div
                    key={conv.taskId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/chat/${conv.taskId}`}>
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all",
                          conv.unreadCount > 0 ? "glass-premium gradient-border" : "glass"
                        )}
                        data-testid={`conversation-${conv.taskId}`}
                      >
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-2 border-white/20 shadow-lg">
                            <AvatarImage src={conv.otherUser?.avatar || undefined} />
                            <AvatarFallback className="gradient-primary text-white font-bold">
                              {conv.otherUser?.name ? getInitials(conv.otherUser.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {conv.unreadCount > 0 && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-6 h-6 gradient-primary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/30"
                            >
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </motion.div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-foreground truncate">
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
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8" />}
                  title="No conversations yet"
                  description="Start chatting with clients or taskers about tasks"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default ConversationsScreen;
