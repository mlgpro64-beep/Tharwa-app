import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

interface UseRealtimeOptions {
    table: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
    onUpdate?: () => void;
    enabled?: boolean;
}

/**
 * Hook for subscribing to real-time database changes
 */
export function useRealtime({
    table,
    event = '*',
    filter,
    onUpdate,
    enabled = true,
}: UseRealtimeOptions) {
    useEffect(() => {
        if (!enabled) return;

        const channelName = `realtime:${table}:${filter || 'all'}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes' as any,
                {
                    event,
                    schema: 'public',
                    table,
                    ...(filter && { filter }),
                },
                (payload: any) => {
                    console.log(`[Realtime] ${table} ${event}:`, payload);
                    onUpdate?.();
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] ${channelName} status:`, status);
            });

        return () => {
            channel.unsubscribe();
        };
    }, [table, event, filter, onUpdate, enabled]);
}

/**
 * Hook for real-time task bids updates
 */
export function useRealtimeBids(taskId: string | undefined, enabled = true) {
    useRealtime({
        table: 'bids',
        event: 'INSERT',
        filter: taskId ? `task_id=eq.${taskId}` : undefined,
        enabled: enabled && !!taskId,
        onUpdate: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'bids'] });
        },
    });
}

/**
 * Hook for real-time messages updates
 */
export function useRealtimeMessages(taskId: string | undefined, enabled = true) {
    useRealtime({
        table: 'messages',
        event: 'INSERT',
        filter: taskId ? `task_id=eq.${taskId}` : undefined,
        enabled: enabled && !!taskId,
        onUpdate: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId, 'messages'] });
        },
    });
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications(userId: string | undefined, enabled = true) {
    useRealtime({
        table: 'notifications',
        event: 'INSERT',
        filter: userId ? `user_id=eq.${userId}` : undefined,
        enabled: enabled && !!userId,
        onUpdate: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        },
    });
}
