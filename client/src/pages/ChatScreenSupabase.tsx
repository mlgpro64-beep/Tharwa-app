// Chat Screen using Supabase Realtime (instead of WebSockets)
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Send, MessageCircle, Phone, Loader2 } from 'lucide-react';
import type { MessageWithUsers, TaskWithDetails, User } from '@shared/schema';

const ChatScreenSupabase = memo(function ChatScreenSupabase() {
  const { taskId } = useParams<{ taskId: string }>();
  const [message, setMessage] = useState('');
  const [displayMessages, setDisplayMessages] = useState<MessageWithUsers[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const isAuthenticated = !!localStorage.getItem('userId');

  // Early return if no taskId
  if (!taskId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={<MessageCircle className="w-8 h-8" />}
          title="Invalid Chat"
          description="Task ID is missing"
        />
      </div>
    );
  }

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: isAuthenticated,
    staleTime: 0, // Always get fresh user data
  });
  
  // Debug: Log current user and message ownership
  useEffect(() => {
    if (currentUser && displayMessages.length > 0) {
      console.log('[Chat] Current user ID:', currentUser.id);
      console.log('[Chat] Messages ownership:', displayMessages.map(m => ({
        content: m.content?.substring(0, 20),
        senderId: m.senderId,
        isOwn: m.senderId === currentUser.id
      })));
    }
  }, [currentUser, displayMessages]);

  const { data: task } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', taskId],
    enabled: isAuthenticated && !!taskId,
  });

  const { data: messages, isLoading, error, refetch } = useQuery<MessageWithUsers[]>({
    queryKey: ['/api/tasks', taskId, 'messages'],
    enabled: isAuthenticated && !!taskId,
    retry: 2,
    retryDelay: 1000,
    staleTime: 0, // Always refetch to get latest messages
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!taskId || !currentUser?.id) {
      console.log('[Realtime] Skipping subscription - missing taskId or currentUser');
      return;
    }

    if (!supabase) {
      console.warn('[Realtime] Supabase not available, skipping Realtime subscription');
      return;
    }

    let channel: any = null;
    
    try {
      // Subscribe to new messages
      channel = supabase
          .channel(`task:${taskId}`)
          .on('postgres_changes' as any, {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `task_id=eq.${taskId}`
          }, (payload: any) => {
            try {
              console.log('[Realtime] New message received:', payload);
              // Invalidate query to refetch messages with proper sender/receiver data
              queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'messages'] });
            } catch (err) {
              console.error('[Realtime] Error handling message:', err);
            }
          })
          .subscribe((status: string) => {
            console.log('[Realtime] Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] Successfully subscribed to messages');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] Channel error - check Supabase Realtime configuration');
            } else if (status === 'TIMED_OUT') {
              console.warn('[Realtime] Subscription timed out');
            }
          });

      channelRef.current = channel;
    } catch (error) {
      console.error('[Realtime] Failed to setup subscription:', error);
      // Don't crash if Realtime fails - app should still work without it
    }

    return () => {
      try {
        if (channelRef.current) {
          channelRef.current.unsubscribe().catch((err: any) => {
            console.error('[Realtime] Error unsubscribing:', err);
          });
          channelRef.current = null;
        }
      } catch (err) {
        console.error('[Realtime] Error in cleanup:', err);
      }
    };
  }, [taskId, currentUser?.id]);

  // Sync messages from API with display messages
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      // Filter out any messages without content or invalid messages
      const validMessages = messages.filter(msg => {
        return msg && 
               msg.id && 
               msg.content && 
               typeof msg.content === 'string' && 
               msg.content.trim().length > 0;
      });
      
      // Always update display messages, even if empty array
      setDisplayMessages(prev => {
        const messageMap = new Map<string, MessageWithUsers>();
        
        // Add existing messages that are valid
        prev.forEach(msg => {
          if (msg && msg.id && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0) {
            messageMap.set(msg.id, msg);
          }
        });
        
        // Add new messages from API
        validMessages.forEach(msg => {
          if (msg && msg.id && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0) {
            messageMap.set(msg.id, msg);
          }
        });
        
        // Sort by createdAt
        const sorted = Array.from(messageMap.values()).sort((a, b) => {
          try {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeA - timeB;
          } catch {
            return 0;
          }
        });
        
        return sorted;
      });
    }
  }, [messages]);

  // Improved auto-scroll with user scroll detection
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Check if user is near bottom before auto-scrolling
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (displayMessages.length > 0) {
      const shouldScroll = isNearBottom();
      if (shouldScroll) {
        // Small delay to ensure DOM is updated
        setTimeout(() => scrollToBottom(true), 100);
      }
    }
  }, [displayMessages.length, scrollToBottom, isNearBottom]);

  // Track user scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Initial scroll to bottom on mount
  useEffect(() => {
    if (displayMessages.length > 0 && !isLoading) {
      setTimeout(() => scrollToBottom(false), 200);
    }
  }, [isLoading, scrollToBottom]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!content.trim() || !taskId) {
        throw new Error('Invalid message or task ID');
      }
      const response = await apiRequest('POST', `/api/tasks/${taskId}/messages`, { content: content.trim() });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (newMessage) => {
      if (newMessage && newMessage.id && newMessage.content && typeof newMessage.content === 'string') {
        // Optimistically add the new message to display
        setDisplayMessages(prev => {
          const exists = prev.some(m => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        // Clear input
        setMessage('');
        
        // Focus input and scroll
        setTimeout(() => {
          inputRef.current?.focus();
          scrollToBottom(true);
        }, 50);
        
        // Refetch to ensure sync with server
        refetch();
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      // Keep the message in input so user can retry
    },
  });

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(trimmedMessage);
    }
  }, [message, sendMessageMutation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const formatTime = useCallback((date: Date | string | null | undefined) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }, []);

  const getInitials = useCallback((name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const otherUser = task && currentUser 
    ? (task.client?.id === currentUser.id ? (task.tasker || null) : (task.client || null))
    : null;

  // Group messages by date for better organization
  const groupMessagesByDate = useCallback((msgs: MessageWithUsers[]) => {
    const groups: { date: string; messages: MessageWithUsers[] }[] = [];
    let currentDate = '';
    
    msgs.forEach(msg => {
      if (!msg.createdAt) return;
      const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [] });
      }
      
      if (groups.length > 0) {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  }, []);

  const messageGroups = groupMessagesByDate(displayMessages);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 glass border-b border-border/50 sticky top-0 z-20 backdrop-blur-xl pt-safe"
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl glass-button hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        
        <Avatar className="w-10 h-10 border-2 border-primary/20 shadow-md ring-2 ring-primary/10">
          <AvatarImage src={otherUser?.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white font-semibold text-sm">
            {getInitials(otherUser?.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate text-base">{otherUser?.name || 'Chat'}</h2>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              "bg-success animate-pulse"
            )} />
            <p className="text-xs text-muted-foreground truncate">
              {task?.title || 'Online'}
            </p>
          </div>
        </div>
        
        {otherUser?.phone && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open(`tel:${otherUser.phone}`, '_self')}
            className="w-10 h-10 flex items-center justify-center rounded-xl glass-button hover:bg-success/10 transition-colors"
            data-testid="button-call"
          >
            <Phone className="w-5 h-5 text-success" />
          </motion.button>
        )}
      </motion.div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 no-scrollbar"
      >
        <AnimatePresence mode="wait">
          {isLoading && displayMessages.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("flex gap-3 items-end", i % 2 === 0 && "justify-end")}>
                  {i % 2 !== 0 && (
                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  )}
                  <div className="flex flex-col gap-1.5 max-w-[75%]">
                    <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "rounded-br-sm" : "rounded-bl-sm")} />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center px-4"
            >
              <EmptyState
                icon={<MessageCircle className="w-8 h-8" />}
                title="Failed to load messages"
                description="Please try again later"
              />
            </motion.div>
          ) : displayMessages && displayMessages.length > 0 ? (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {messageGroups && messageGroups.length > 0 ? messageGroups.map((group, groupIndex) => (
                <div key={group.date} className="space-y-4">
                  {/* Date Separator */}
                  <div className="flex items-center justify-center py-2">
                    <div className="px-3 py-1 rounded-full glass text-xs font-medium text-muted-foreground">
                      {group.date}
                    </div>
                  </div>
                  
                  {/* Messages in this group */}
                  {group.messages.map((msg, msgIndex) => {
                    const isOwn = msg.senderId === currentUser?.id;
                    const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                    const nextMsg = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
                    const showAvatar = !isOwn && (!nextMsg || nextMsg.senderId !== msg.senderId);
                    const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                    const timeDiff = prevMsg && msg.createdAt && prevMsg.createdAt
                      ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
                      : Infinity;
                    const showTime = !isConsecutive || timeDiff > 5 * 60 * 1000; // Show time if > 5 min gap
                    
                    // Validate message content
                    if (!msg || !msg.id || !msg.content || typeof msg.content !== 'string' || !msg.content.trim()) {
                      return null;
                    }

                    // Safe access to sender/receiver
                    const sender = msg.sender || null;
                    const senderName = sender?.name || 'Unknown';
                    
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.2,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className={cn(
                          "flex gap-2 items-end",
                          isOwn ? "justify-end" : "justify-start",
                          !showTime && "mt-0.5"
                        )}
                      >
                        {/* Avatar for received messages */}
                        {!isOwn && (
                          <div className="w-8 h-8 flex-shrink-0">
                            {showAvatar ? (
                              <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
                                <AvatarImage src={sender?.avatar || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-muted to-muted-foreground/20 text-foreground text-xs font-medium">
                                  {getInitials(senderName)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8" />
                            )}
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={cn(
                          "flex flex-col gap-1 max-w-[75%] sm:max-w-[65%]",
                          isOwn && "items-end"
                        )}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              "px-4 py-2.5 rounded-2xl shadow-sm relative",
                              "transition-all duration-200",
                              isOwn
                                ? "bg-gradient-to-br from-primary to-primary-dark text-white rounded-br-sm"
                                : "bg-card text-card-foreground border border-border/50 rounded-bl-sm",
                              !showTime && isOwn && "rounded-tr-sm",
                              !showTime && !isOwn && "rounded-tl-sm"
                            )}
                          >
                            <p className={cn(
                              "text-sm leading-relaxed break-words whitespace-pre-wrap",
                              isOwn ? "text-white" : "text-foreground"
                            )}>
                              {msg.content}
                            </p>
                          </motion.div>
                          
                          {/* Timestamp */}
                          {showTime && (
                            <p className={cn(
                              "text-[10px] text-muted-foreground px-1.5",
                              isOwn && "text-right"
                            )}>
                              {formatTime(msg.createdAt)}
                            </p>
                          )}
                        </div>
                        
                        {/* Spacer for sent messages */}
                        {isOwn && <div className="w-8 flex-shrink-0" />}
                      </motion.div>
                    );
                  })}
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No valid messages to display
                </div>
              )}
            </motion.div>
          ) : !isLoading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center px-4"
            >
              <EmptyState
                icon={<MessageCircle className="w-12 h-12 text-muted-foreground" />}
                title="No messages yet"
                description="Start the conversation by sending a message"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-0 left-0 right-0 p-3 glass border-t border-border/50 backdrop-blur-xl pb-safe"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sendMessageMutation.isPending}
              maxLength={1000}
              className={cn(
                "w-full min-h-[44px] max-h-32 px-4 py-2.5 rounded-2xl",
                "glass-input text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                "transition-all duration-200 resize-none",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              data-testid="input-message"
            />
            {message.length > 800 && (
              <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                {message.length}/1000
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-primary to-primary-dark text-white",
              "shadow-lg shadow-primary/30 transition-all",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:shadow-xl hover:shadow-primary/40"
            )}
            data-testid="button-send"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

export default ChatScreenSupabase;










