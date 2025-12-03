import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import type { MessageWithUsers, TaskWithDetails, User } from '@shared/schema';

const ChatScreen = memo(function ChatScreen() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('');
  const [displayMessages, setDisplayMessages] = useState<MessageWithUsers[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isAuthenticated = !!localStorage.getItem('userId');

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: isAuthenticated,
  });

  const { data: task } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', taskId],
    enabled: isAuthenticated && !!taskId,
  });

  const { data: messages, isLoading } = useQuery<MessageWithUsers[]>({
    queryKey: ['/api/tasks', taskId, 'messages'],
    refetchInterval: 3000,
    enabled: isAuthenticated && !!taskId,
  });

  useEffect(() => {
    if (!taskId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?taskId=${taskId}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          if (type === 'message') {
            setDisplayMessages(prev => [...prev, data]);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed, falling back to polling', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (messages) {
      setDisplayMessages(messages);
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/tasks/${taskId}/messages`, { content });
      return response.json();
    },
    onSuccess: (newMessage) => {
      setDisplayMessages(prev => [...prev, newMessage]);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'messages'] });
      setMessage('');
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', data: newMessage }));
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleSend = useCallback(() => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  }, [message, sendMessageMutation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const formatTime = useCallback((date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }, []);

  const getInitials = useCallback((name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const otherUser = task?.client?.id === currentUser?.id ? task?.tasker : task?.client;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-6 py-4 glass border-b border-white/10 sticky top-0 z-10 pt-safe"
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-2xl glass-button"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <Avatar className="w-11 h-11 border-2 border-white/20 shadow-lg">
          <AvatarImage src={otherUser?.avatar || undefined} />
          <AvatarFallback className="gradient-primary text-white font-bold text-sm">
            {otherUser?.name ? getInitials(otherUser.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">{otherUser?.name || 'Chat'}</h2>
          <p className="text-xs text-muted-foreground truncate">{task?.title}</p>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {isLoading && displayMessages.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex gap-3", i % 2 === 0 && "justify-end")}>
                  {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                  <Skeleton className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-2/3" : "w-3/4")} />
                </div>
              ))}
            </motion.div>
          ) : displayMessages.length > 0 ? (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {displayMessages.map((msg, index) => {
                const isOwn = msg.senderId === currentUser?.id;
                return (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn("flex gap-3", isOwn && "justify-end")}
                  >
                    {!isOwn && (
                      <Avatar className="w-8 h-8 border border-white/20 flex-shrink-0 shadow">
                        <AvatarImage src={msg.sender?.avatar || undefined} />
                        <AvatarFallback className="gradient-primary text-white font-bold text-xs">
                          {msg.sender?.name ? getInitials(msg.sender.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[75%]", isOwn && "order-first")}>
                      <div className={cn(
                        "px-4 py-3 rounded-2xl shadow-sm",
                        isOwn 
                          ? "gradient-primary text-white rounded-br-md" 
                          : "glass rounded-bl-md"
                      )}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <p className={cn(
                        "text-xs text-muted-foreground mt-1.5",
                        isOwn && "text-right"
                      )}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <EmptyState
                icon={<MessageCircle className="w-8 h-8" />}
                title="No messages yet"
                description="Start the conversation"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-0 left-0 right-0 p-4 glass border-t border-white/10 pb-safe"
      >
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 h-12 px-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            data-testid="input-message"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-12 h-12 gradient-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
            data-testid="button-send"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

export default ChatScreen;
