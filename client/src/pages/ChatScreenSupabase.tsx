// Chat Screen using Supabase Realtime (instead of WebSockets)
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton, EmptyState } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import type { MessageWithUsers, TaskWithDetails, User } from '@shared/schema';

const ChatScreenSupabase = memo(function ChatScreenSupabase() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('');
  const [displayMessages, setDisplayMessages] = useState<MessageWithUsers[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
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
    enabled: isAuthenticated && !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fk(id, username, name, avatar),
          receiver:users!messages_receiver_id_fk(id, username, name, avatar)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MessageWithUsers[];
    }
  });

  // Supabase Realtime subscription
  useEffect(() => {
    if (!taskId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`task:${taskId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `task_id=eq.${taskId}`
      }, (payload) => {
        // Fetch sender and receiver details
        Promise.all([
          supabase.from('users').select('id, username, name, avatar').eq('id', payload.new.sender_id).single(),
          supabase.from('users').select('id, username, name, avatar').eq('id', payload.new.receiver_id).single()
        ]).then(([senderRes, receiverRes]) => {
          const newMessage: MessageWithUsers = {
            ...payload.new,
            sender: senderRes.data,
            receiver: receiverRes.data
          } as MessageWithUsers;

          setDisplayMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        });
      })
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    channelRef.current = channel;

    // Load initial messages
    if (messages) {
      setDisplayMessages(messages);
    }

    return () => {
      channel.unsubscribe();
    };
  }, [taskId, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!task || !currentUser) throw new Error('Missing task or user');

      const receiverId = task.clientId === currentUser.id ? task.taskerId : task.clientId;
      if (!receiverId) throw new Error('No receiver found');

      // Use Supabase Edge Function or direct insert
      const USE_EDGE_FUNCTION = import.meta.env.VITE_USE_SUPABASE_EDGE_FUNCTIONS === 'true';

      if (USE_EDGE_FUNCTION) {
        // Use Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tywwcinmoncjkitzqfaa.supabase.co';
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/send-message?task_id=${taskId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({
            content,
            receiver_id: receiverId
          })
        });

        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
      } else {
        // Direct insert (Supabase Realtime will broadcast automatically)
        const { data, error } = await supabase
          .from('messages')
          .insert({
            task_id: taskId,
            sender_id: currentUser.id,
            receiver_id: receiverId,
            content: content.trim(),
            read: false
          })
          .select(`
            *,
            sender:users!messages_sender_id_fk(id, username, name, avatar),
            receiver:users!messages_receiver_id_fk(id, username, name, avatar)
          `)
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'messages'] });
    }
  });

  const handleSend = useCallback(() => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  }, [message, sendMessageMutation]);

  if (!taskId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Task ID is required</p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-screen" />;
  }

  const receiver = task && currentUser
    ? (task.clientId === currentUser.id ? task.tasker : task.client)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => setLocation('/messages')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {receiver && (
            <>
              <Avatar>
                <AvatarImage src={receiver.avatar || undefined} />
                <AvatarFallback>{receiver.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{receiver.name}</p>
                <p className="text-sm text-muted-foreground">{task?.title}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {displayMessages.map((msg) => {
            const isOwn = msg.senderId === currentUser?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-2",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                {!isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={msg.sender?.avatar || undefined} />
                    <AvatarFallback>{msg.sender?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 pb-safe">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالة..."
            className="flex-1 rounded-2xl bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="p-3 rounded-2xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatScreenSupabase;










