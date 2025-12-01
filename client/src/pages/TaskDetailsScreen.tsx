import { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { OfferCard } from '@/components/OfferCard';
import { Modal } from '@/components/Modal';
import { FloatingInput } from '@/components/FloatingInput';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { TaskWithDetails, BidWithTasker } from '@shared/schema';

export default function TaskDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { userRole, savedTaskIds, toggleSavedTask } = useApp();
  const { toast } = useToast();
  
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const { data: task, isLoading } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', id],
  });

  const { data: bids } = useQuery<BidWithTasker[]>({
    queryKey: ['/api/tasks', id, 'bids'],
  });

  const placeBidMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/tasks/${id}/bids`, {
        amount: parseFloat(bidAmount),
        message: bidMessage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id, 'bids'] });
      setShowBidModal(false);
      setBidAmount('');
      setBidMessage('');
      toast({ title: 'Offer sent!', description: 'The client will review your offer' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send offer', description: error.message, variant: 'destructive' });
    },
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      return apiRequest('POST', `/api/bids/${bidId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id, 'bids'] });
      toast({ title: 'Offer accepted!', description: 'The tasker has been assigned' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to accept offer', description: error.message, variant: 'destructive' });
    },
  });

  const isSaved = id ? savedTaskIds.includes(id) : false;
  const isClient = userRole === 'client';
  const isTasker = userRole === 'tasker';

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-success/10 text-success';
      case 'assigned': return 'bg-warning/10 text-warning';
      case 'in_progress': return 'bg-primary/10 text-primary';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Screen className="px-6">
        <div className="py-4">
          <Skeleton className="h-10 w-10 rounded-full mb-6" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-20 w-full mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen className="px-6 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-muted-foreground">error</span>
          </div>
          <h3 className="font-bold text-foreground mb-2">Task not found</h3>
          <Link href="/home">
            <button className="text-primary font-bold">Go back home</button>
          </Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className="px-0" safeAreaBottom={false}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
            data-testid="button-back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            {isTasker && (
              <button
                onClick={() => id && toggleSavedTask(id)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
                data-testid="button-save-task"
              >
                <span className={cn(
                  "material-symbols-outlined",
                  isSaved && "material-symbols-filled text-destructive"
                )}>
                  favorite
                </span>
              </button>
            )}
            {isClient && task.status === 'open' && (
              <Link href={`/task/${id}/edit`}>
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
                  data-testid="button-edit-task"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {task.category}
          </span>
          <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", getStatusColor(task.status))}>
            {task.status.replace('_', ' ')}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-4">{task.title}</h1>

        <p className="text-muted-foreground leading-relaxed mb-6">{task.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <span className="material-symbols-outlined text-base">location_on</span>
              Location
            </div>
            <p className="font-bold text-foreground">{task.location}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <span className="material-symbols-outlined text-base">schedule</span>
              When
            </div>
            <p className="font-bold text-foreground">{task.date} at {task.time}</p>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Budget</p>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(task.budget)}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">payments</span>
            </div>
          </div>
        </div>

        {task.client && (
          <div className="bg-card p-4 rounded-2xl border border-border mb-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Posted by</p>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-border">
                <AvatarImage src={task.client.avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {task.client.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-foreground">{task.client.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="material-symbols-outlined material-symbols-filled text-warning text-sm">star</span>
                  {parseFloat(String(task.client.rating || 0)).toFixed(1)}
                </div>
              </div>
              <Link href={`/chat/${task.id}`}>
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-90"
                  data-testid="button-chat"
                >
                  <span className="material-symbols-outlined">chat</span>
                </button>
              </Link>
            </div>
          </div>
        )}

        {isClient && bids && bids.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Offers ({bids.length})
            </h2>
            <div className="space-y-3">
              {bids.map((bid) => (
                <OfferCard 
                  key={bid.id} 
                  offer={bid}
                  onAccept={(bidId) => acceptBidMutation.mutate(bidId)}
                  showActions={task.status === 'open'}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {isTasker && task.status === 'open' && (
        <div className="sticky bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-xl border-t border-border pb-safe">
          <button
            onClick={() => setShowBidModal(true)}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
            data-testid="button-make-offer"
          >
            Make an Offer
          </button>
        </div>
      )}

      {task.status === 'in_progress' && (
        <div className="sticky bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-xl border-t border-border pb-safe">
          <Link href={`/task/${id}/progress`}>
            <button
              className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
              data-testid="button-view-progress"
            >
              View Progress
            </button>
          </Link>
        </div>
      )}

      <Modal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        title="Make an Offer"
        action={
          <button
            onClick={() => placeBidMutation.mutate()}
            disabled={!bidAmount || placeBidMutation.isPending}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
            data-testid="button-submit-offer"
          >
            {placeBidMutation.isPending ? 'Sending...' : 'Send Offer'}
          </button>
        }
      >
        <div className="space-y-4">
          <FloatingInput
            label="Your Offer Amount ($)"
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="0"
          />
          <FloatingInput
            label="Message (Optional)"
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            placeholder="Tell them why you're a great fit..."
          />
          <p className="text-xs text-muted-foreground text-center">
            Client's budget: {formatCurrency(task.budget)}
          </p>
        </div>
      </Modal>
    </Screen>
  );
}
