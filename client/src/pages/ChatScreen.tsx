import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { MessageWithUsers, TaskWithDetails, User } from '@shared/schema';

export default function ChatScreen() {
  const { taskId } = useParams<{ taskId: string }>();
  const [message, setMessage] = useState('');
  const [displayMessages, setDisplayMessages] = useState<MessageWithUsers[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });

  const { data: task } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', taskId],
  });

  const { data: messages, isLoading } = useQuery<MessageWithUsers[]>({
    queryKey: ['/api/tasks', taskId, 'messages'],
    refetchInterval: 3000,
  });

  // Initialize WebSocket connection
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

  // Update display messages from API
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
      
      // Send via WebSocket if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', data: newMessage }));
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const otherUser = task?.client?.id === currentUser?.id ? task?.tasker : task?.client;

  return (
    <Screen className="px-0" safeAreaBottom={false}>
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        
        <Avatar className="w-10 h-10 border-2 border-border">
          <AvatarImage src={otherUser?.avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
            {otherUser?.name ? getInitials(otherUser.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">{otherUser?.name || 'Chat'}</h2>
          <p className="text-xs text-muted-foreground truncate">{task?.title}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoading && displayMessages.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("flex gap-3", i % 2 === 0 && "justify-end")}>
                {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                <Skeleton className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-2/3" : "w-3/4")} />
              </div>
            ))}
          </div>
        ) : displayMessages.length > 0 ? (
          displayMessages.map((msg) => {
            const isOwn = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={cn("flex gap-3", isOwn && "justify-end")}>
                {!isOwn && (
                  <Avatar className="w-8 h-8 border border-border flex-shrink-0">
                    <AvatarImage src={msg.sender?.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {msg.sender?.name ? getInitials(msg.sender.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[75%]", isOwn && "order-first")}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl",
                    isOwn 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-card border border-border rounded-bl-sm"
                  )}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <p className={cn(
                    "text-xs text-muted-foreground mt-1",
                    isOwn && "text-right"
                  )}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">chat</span>
            </div>
            <h3 className="font-bold text-foreground mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start the conversation
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border pb-safe">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 h-12 px-4 rounded-full bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            data-testid="input-message"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-90 transition-all disabled:opacity-50"
            data-testid="button-send"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </Screen>
  );
}
