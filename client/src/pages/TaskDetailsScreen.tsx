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
  MessageCircle, Star, AlertCircle, Loader2, Send, Calendar, Sparkles, Trash2, CheckCircle
} from 'lucide-react';
import TaskLocationMap from '@/components/TaskLocationMap';
import type { TaskWithDetails, BidWithTasker } from '@shared/schema';
import { getCategoryInfo, TASK_CATEGORIES_WITH_SUBS } from '@shared/schema';
import { useTranslation } from 'react-i18next';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const TaskDetailsScreen = memo(function TaskDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, userRole, savedTaskIds, toggleSavedTask } = useApp();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [showBidModal, setShowBidModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  
  const handleBidAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBidAmount(e.target.value);
  }, []);
  
  const handleBidMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBidMessage(e.target.value);
  }, []);
  
  const handleCloseBidModal = useCallback(() => {
    setShowBidModal(false);
  }, []);
  
  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

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

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/my'] });
      setShowDeleteModal(false);
      toast({ title: isArabic ? 'تم حذف المهمة' : 'Task deleted', description: isArabic ? 'تم حذف المهمة بنجاح' : 'The task has been removed successfully' });
      setLocation('/my-tasks');
    },
    onError: (error: Error) => {
      toast({ title: isArabic ? 'فشل الحذف' : 'Failed to delete', description: error.message, variant: 'destructive' });
    },
  });

  const requestCompletionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/tasks/${id}/request-completion`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id] });
      toast({ 
        title: isArabic ? 'تم إرسال الطلب' : 'Request sent', 
        description: isArabic ? 'تم إرسال طلب إتمام المهمة للعميل' : 'Completion request sent to client'
      });
    },
    onError: (error: Error) => {
      toast({ title: isArabic ? 'فشل الإرسال' : 'Request failed', description: error.message, variant: 'destructive' });
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

  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'open': return { bg: 'bg-success/15', text: 'text-success', label: 'Open' };
      case 'assigned': return { bg: 'bg-warning/15', text: 'text-warning', label: 'Assigned' };
      case 'in_progress': return { bg: 'bg-primary/15', text: 'text-primary', label: 'In Progress' };
      case 'completed': return { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Completed' };
      case 'cancelled': return { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Cancelled' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', label: status };
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
      <div className="min-h-screen gradient-mesh pt-safe px-5 py-5">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-3/4 mb-4 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-2xl mb-5" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-32 rounded-2xl mb-5" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-premium rounded-3xl p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Task not found</h3>
          <p className="text-muted-foreground mb-6 text-sm">This task may have been removed</p>
          <Link href="/home">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
            >
              Go back home
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-20 -right-24 w-72 h-72 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-40 -left-16 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 px-5 py-5"
      >
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-6"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/80" />
          </motion.button>
          
          <div className="flex items-center gap-2.5">
            {isTasker && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleToggleSave}
                className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
                data-testid="button-save-task"
              >
                <Heart className={cn(
                  "w-5 h-5 transition-all",
                  isSaved ? "fill-destructive text-destructive" : "text-foreground/80"
                )} />
              </motion.button>
            )}
            {isClient && task.status === 'open' && (
              <>
                <Link href={`/task/${id}/edit`}>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
                    data-testid="button-edit-task"
                  >
                    <Edit3 className="w-5 h-5 text-foreground/80" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowDeleteModal(true)}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
                  data-testid="button-delete-task"
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          {(() => {
            const catInfo = getCategoryInfo(task.category);
            let categoryDisplay: string;
            let categoryColor: string;
            
            if (catInfo?.subcategory) {
              categoryDisplay = isArabic ? catInfo.subcategory.nameAr : catInfo.subcategory.nameEn;
              categoryColor = TASK_CATEGORIES_WITH_SUBS[catInfo.mainCategory]?.colorHex || '#6B7280';
            } else if (catInfo) {
              categoryDisplay = isArabic 
                ? TASK_CATEGORIES_WITH_SUBS[catInfo.mainCategory]?.nameAr || task.category
                : TASK_CATEGORIES_WITH_SUBS[catInfo.mainCategory]?.nameEn || task.category;
              categoryColor = TASK_CATEGORIES_WITH_SUBS[catInfo.mainCategory]?.colorHex || '#6B7280';
            } else {
              categoryDisplay = task.category;
              categoryColor = '#6B7280';
            }
            
            return (
              <div className="flex items-center gap-2 mb-3">
                <span 
                  className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  {categoryDisplay}
                </span>
                <span className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                  statusConfig.bg, statusConfig.text
                )}>
                  {statusConfig.label}
                </span>
              </div>
            );
          })()}

          <h1 className="text-2xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
            {task.title}
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-6">
            {task.description}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-3">
          <div className="glass rounded-[20px] p-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-2.5">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Location</p>
            <p className="font-bold text-foreground text-sm truncate">{task.location}</p>
          </div>
          <div className="glass rounded-[20px] p-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mb-2.5">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">When</p>
            <p className="font-bold text-foreground text-sm">{task.date}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{task.time}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-5">
          <TaskLocationMap 
            latitude={task.latitude}
            longitude={task.longitude}
            location={task.location}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[24px] mb-5">
          <div className="absolute inset-0 glass-premium" />
          <div className="absolute inset-0 gradient-border" />
          
          <div className="relative p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Budget</p>
                <p className="text-3xl font-extrabold gradient-text-primary">{formatCurrency(task.budget)}</p>
              </div>
              <motion.div 
                whileHover={{ rotate: 5 }}
                className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <DollarSign className="w-7 h-7 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {task.client && (
          <motion.div variants={itemVariants} className="glass rounded-[24px] p-5 mb-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Posted by</p>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white/30 shadow-lg">
                <AvatarImage src={task.client.avatar || undefined} />
                <AvatarFallback className="gradient-primary text-white font-bold">
                  {task.client.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{task.client.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                  <span className="font-medium">{parseFloat(String(task.client.rating || 0)).toFixed(1)}</span>
                </div>
              </div>
              <Link href={`/chat/${task.id}`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl gradient-primary text-white shadow-md shadow-primary/25"
                  data-testid="button-chat"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {isClient && bids && bids.length > 0 && (
          <motion.div variants={itemVariants} className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Offers
              </h2>
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                {bids.length}
              </span>
            </div>
            <div className="space-y-3">
              {bids.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
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
      </motion.div>

      <AnimatePresence>
        {isTasker && task.status === 'open' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 p-5 glass-premium border-t-0 rounded-t-[28px] pb-safe"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBidModal(true)}
              className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2.5"
              data-testid="button-make-offer"
            >
              <Sparkles className="w-5 h-5" />
              Make an Offer
            </motion.button>
          </motion.div>
        )}

        {isTasker && task.status === 'assigned' && task.taskerId === user?.id && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 p-5 glass-premium border-t-0 rounded-t-[28px] pb-safe"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => requestCompletionMutation.mutate()}
              disabled={requestCompletionMutation.isPending}
              className="w-full h-14 bg-gradient-to-r from-success to-success/80 text-white rounded-2xl font-bold text-base shadow-xl shadow-success/30 flex items-center justify-center gap-2.5 disabled:opacity-50"
              data-testid="button-request-completion"
            >
              {requestCompletionMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {isArabic ? 'تم إنجاز المهمة' : 'Task Completed'}
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {isClient && task.status === 'in_progress' && task.clientId === user?.id && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 p-5 glass-premium border-t-0 rounded-t-[28px] pb-safe"
          >
            <Link href={`/task/${id}/payment`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-14 bg-gradient-to-r from-success to-success/80 text-white rounded-2xl font-bold text-base shadow-xl shadow-success/30 flex items-center justify-center gap-2.5"
                data-testid="button-complete-payment"
              >
                <DollarSign className="w-5 h-5" />
                {isArabic ? 'إتمام الدفع' : 'Complete Payment'}
              </motion.button>
            </Link>
          </motion.div>
        )}

        {isTasker && task.status === 'in_progress' && task.taskerId === user?.id && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 p-5 glass-premium border-t-0 rounded-t-[28px] pb-safe"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-warning/15 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <p className="font-bold text-foreground mb-1" data-testid="text-waiting-payment">
                {isArabic ? 'في انتظار الدفع' : 'Awaiting Payment'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'العميل سيقوم بالدفع لإتمام المهمة' : 'Client will complete payment to finish the task'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showBidModal}
        onClose={handleCloseBidModal}
        title="Make an Offer"
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => placeBidMutation.mutate()}
            disabled={!bidAmount || placeBidMutation.isPending}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2.5"
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
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={bidAmount}
              onChange={handleBidAmountChange}
              placeholder="Your offer amount"
              autoComplete="off"
              autoCorrect="off"
              className="w-full h-13 pl-12 pr-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
              data-testid="input-bid-amount"
            />
          </div>
          <textarea
            value={bidMessage}
            onChange={handleBidMessageChange}
            placeholder="Tell them why you're a great fit... (optional)"
            rows={3}
            autoComplete="off"
            autoCorrect="off"
            className="w-full p-4 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-base"
            data-testid="input-bid-message"
          />
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Client's budget: <span className="font-bold text-primary">{formatCurrency(task.budget)}</span>
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title={isArabic ? 'حذف المهمة' : 'Delete Task'}
        action={
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCloseDeleteModal}
              className="flex-1 h-14 rounded-2xl font-bold glass"
              data-testid="button-cancel-delete"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => deleteTaskMutation.mutate()}
              disabled={deleteTaskMutation.isPending}
              className="flex-1 h-14 bg-destructive text-white rounded-2xl font-bold shadow-xl shadow-destructive/30 disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="button-confirm-delete"
            >
              {deleteTaskMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  {isArabic ? 'حذف' : 'Delete'}
                </>
              )}
            </motion.button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground mb-2" data-testid="text-delete-confirmation">
            {isArabic 
              ? 'هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to delete this task? This action cannot be undone.'}
          </p>
          <p className="font-bold text-foreground" data-testid="text-delete-task-title">
            {task.title}
          </p>
        </div>
      </Modal>
    </div>
  );
});

export default TaskDetailsScreen;
