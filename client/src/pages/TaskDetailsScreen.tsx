import { useState, memo, useCallback, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { OfferCard } from '@/components/OfferCard';
import { Modal } from '@/components/Modal';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton, LoadingSpinner } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Heart, Edit3, MapPin, Clock, DollarSign, 
  MessageCircle, Star, AlertCircle, Loader2, Send
} from 'lucide-react';
import TaskLocationMap from '@/components/TaskLocationMap';
import type { TaskWithDetails, BidWithTasker } from '@shared/schema';

const TaskDetailsScreen = memo(function TaskDetailsScreen() {
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

  const isSaved = useMemo(() => id ? savedTaskIds.includes(id) : false, [id, savedTaskIds]);
  const isClient = userRole === 'client';
  const isTasker = userRole === 'tasker';

  const formatCurrency = useCallback((amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }, []);

  const getStatusStyles = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'bg-success/15 text-success border-success/20';
      case 'assigned': return 'bg-warning/15 text-warning border-warning/20';
      case 'in_progress': return 'bg-primary/15 text-primary border-primary/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/15 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }, []);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleToggleSave = useCallback(() => {
    if (id) toggleSavedTask(id);
  }, [id, toggleSavedTask]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-safe px-6 py-6">
        <Skeleton className="h-11 w-11 rounded-2xl mb-6" />
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-24 w-full rounded-2xl mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-safe flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Task not found</h3>
          <p className="text-muted-foreground mb-6">This task may have been removed</p>
          <Link href="/home">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
            >
              Go back home
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-20 -right-20 w-64 h-64 bg-primary/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 py-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            {isTasker && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleSave}
                className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
                data-testid="button-save-task"
              >
                <Heart className={cn(
                  "w-5 h-5 transition-colors",
                  isSaved && "fill-destructive text-destructive"
                )} />
              </motion.button>
            )}
            {isClient && task.status === 'open' && (
              <Link href={`/task/${id}/edit`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
                  data-testid="button-edit-task"
                >
                  <Edit3 className="w-5 h-5" />
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
              {task.category}
            </span>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
              getStatusStyles(task.status)
            )}>
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-foreground mb-4 leading-tight">
            {task.title}
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
            {task.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-4"
        >
          <div className="glass rounded-3xl p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Location</p>
            <p className="font-bold text-foreground">{task.location}</p>
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">When</p>
            <p className="font-bold text-foreground">{task.date} at {task.time}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-6"
        >
          <TaskLocationMap 
            latitude={task.latitude}
            longitude={task.longitude}
            location={task.location}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-premium rounded-3xl p-6 mb-6 gradient-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Budget</p>
              <p className="text-4xl font-extrabold gradient-text">{formatCurrency(task.budget)}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        {task.client && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-5 mb-6"
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Posted by</p>
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-white/20 shadow-lg">
                <AvatarImage src={task.client.avatar || undefined} />
                <AvatarFallback className="gradient-primary text-white font-bold text-lg">
                  {task.client.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg">{task.client.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium">{parseFloat(String(task.client.rating || 0)).toFixed(1)}</span>
                </div>
              </div>
              <Link href={`/chat/${task.id}`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/25"
                  data-testid="button-chat"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {isClient && bids && bids.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">
              Offers <span className="text-primary">({bids.length})</span>
            </h2>
            <div className="space-y-4">
              {bids.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <OfferCard 
                    offer={bid}
                    onAccept={(bidId) => acceptBidMutation.mutate(bidId)}
                    showActions={task.status === 'open'}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isTasker && task.status === 'open' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-2xl border-t border-white/10 pb-safe"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBidModal(true)}
              className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
              data-testid="button-make-offer"
            >
              <Send className="w-5 h-5" />
              Make an Offer
            </motion.button>
          </motion.div>
        )}

        {task.status === 'in_progress' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-2xl border-t border-white/10 pb-safe"
          >
            <Link href={`/task/${id}/progress`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25"
                data-testid="button-view-progress"
              >
                View Progress
              </motion.button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        title="Make an Offer"
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => placeBidMutation.mutate()}
            disabled={!bidAmount || placeBidMutation.isPending}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="button-submit-offer"
          >
            {placeBidMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Offer
              </>
            )}
          </motion.button>
        }
      >
        <div className="space-y-5">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Your offer amount"
              className="w-full h-14 pl-12 pr-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-bid-amount"
            />
          </div>
          <textarea
            value={bidMessage}
            onChange={(e) => setBidMessage(e.target.value)}
            placeholder="Tell them why you're a great fit... (optional)"
            rows={3}
            className="w-full p-4 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            data-testid="input-bid-message"
          />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Client's budget: <span className="font-bold text-primary">{formatCurrency(task.budget)}</span>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default TaskDetailsScreen;
