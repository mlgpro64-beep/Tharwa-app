import { useState, memo, useCallback, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { OfferCard } from '@/components/OfferCard';
import { Modal } from '@/components/Modal';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import {
  ArrowLeft, Heart, Edit3, MapPin, Clock, Wallet, CreditCard, Bell,
  MessageCircle, Star, AlertCircle, Loader2, Send, Calendar, Sparkles, Trash2, CheckCircle, Phone
} from 'lucide-react';
import TaskLocationMap from '@/components/TaskLocationMap';
import type { TaskWithDetails, BidWithTasker } from '@shared/schema';
import { getCategoryInfo, TASK_CATEGORIES_WITH_SUBS } from '@shared/schema';
import { useTranslation } from 'react-i18next';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
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

  const { data: task, isLoading, error } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', id],
    enabled: !!id,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) return false;
        if (error.message.includes('401') || error.message.includes('Authentication')) return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  const { data: bids } = useQuery<BidWithTasker[]>({
    queryKey: ['/api/tasks', id, 'bids'],
    queryFn: async () => {
      if (!id) return [];
      const res = await apiRequest('GET', `/api/tasks/${id}/bids`);
      return res.json();
    },
    enabled: !!id && task?.status === 'open', // Only fetch bids for open tasks
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
      toast({ title: isArabic ? 'تم إرسال العرض!' : 'Offer sent!', description: isArabic ? 'سيراجع العميل عرضك' : 'The client will review your offer' });
    },
    onError: (error: Error) => {
      toast({ title: isArabic ? 'فشل إرسال العرض' : 'Failed to send offer', description: error.message, variant: 'destructive' });
    },
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      return apiRequest('POST', `/api/bids/${bidId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id, 'bids'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: isArabic ? 'تم قبول العرض!' : 'Offer accepted!', description: isArabic ? 'تم تعيين المنفذ' : 'The tasker has been assigned' });
    },
    onError: (error: Error) => {
      toast({ title: isArabic ? 'فشل قبول العرض' : 'Failed to accept offer', description: error.message, variant: 'destructive' });
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

  const { data: reviewData } = useQuery<{ hasReview: boolean; review: any }>({
    queryKey: ['/api/tasks', id, 'review'],
    enabled: !!id,
  });

  // Payment mutation for client - Paylink Integration via Express API
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!task) {
        throw new Error(isArabic ? 'المهمة غير موجودة' : 'Task not found');
      }

      // Call Express API endpoint
      const response = await apiRequest('POST', '/api/payments/create-link', {
        taskId: id,
        amount: parseFloat(String(task.budget)),
        clientPhone: user?.phone || '',
        clientName: user?.name || '',
      });

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Paylink payment page
      if (data.url) {
        toast({
          title: isArabic ? 'جاري التحويل للدفع...' : 'Redirecting to payment...',
          description: isArabic ? 'يرجى إكمال عملية الدفع' : 'Please complete the payment process'
        });
        // Small delay to show toast before redirect
        setTimeout(() => {
          window.location.href = data.url;
        }, 500);
      } else {
        throw new Error(isArabic ? 'لم يتم استلام رابط الدفع' : 'Payment URL not received');
      }
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'فشل بدء عملية الدفع' : 'Failed to initiate payment',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Send payment reminder mutation (for tasker)
  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/tasks/${id}/send-payment-reminder`);
    },
    onSuccess: () => {
      toast({
        title: isArabic ? 'تم إرسال التذكير' : 'Reminder sent',
        description: isArabic ? 'تم إرسال تذكير بالدفع للعميل' : 'Payment reminder sent to client'
      });
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'فشل إرسال التذكير' : 'Failed to send reminder',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/reviews', {
        taskId: id,
        rating: selectedRating,
        comment: ratingComment || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id, 'review'] });
      setShowRatingModal(false);
      setSelectedRating(0);
      setRatingComment('');
      toast({
        title: isArabic ? 'شكراً لتقييمك' : 'Thank you for rating!',
        description: isArabic ? 'تم إرسال تقييمك بنجاح' : 'Your review has been submitted'
      });
    },
    onError: (error: Error) => {
      toast({ title: isArabic ? 'فشل الإرسال' : 'Failed to submit', description: error.message, variant: 'destructive' });
    },
  });

  const isSaved = useMemo(() => id ? savedTaskIds.includes(id) : false, [id, savedTaskIds]);
  const isClient = userRole === 'client';
  const isTasker = userRole === 'tasker';
  const isTaskOwner = useMemo(() => task && user && task.clientId === user.id, [task, user]);
  const isAssignedTasker = useMemo(() => task && user && task.taskerId === user.id, [task, user]);

  const formatTaskCurrency = useCallback((amount: number | string | null | undefined) => {
    return formatCurrency(amount, {
      locale: isArabic ? 'ar' : 'en',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [isArabic]);

  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'open': return { color: 'bg-emerald-500/20 text-emerald-400', label: isArabic ? 'مفتوحة' : 'Open', dot: 'bg-emerald-400' };
      case 'assigned': return { color: 'bg-amber-500/20 text-amber-400', label: isArabic ? 'تم التعيين' : 'Assigned', dot: 'bg-amber-400' };
      case 'in_progress': return { color: 'bg-amber-500/20 text-amber-400', label: isArabic ? 'في انتظار الدفع' : 'Waiting for Payment', dot: 'bg-amber-400' };
      case 'completed': return { color: 'bg-zinc-500/20 text-zinc-400', label: isArabic ? 'مكتملة' : 'Completed', dot: 'bg-zinc-400' };
      case 'cancelled': return { color: 'bg-red-500/20 text-red-400', label: isArabic ? 'ملغاة' : 'Cancelled', dot: 'bg-red-400' };
      default: return { color: 'bg-zinc-500/20 text-zinc-400', label: status, dot: 'bg-zinc-400' };
    }
  }, [isArabic]);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleToggleSave = useCallback(() => {
    if (id) toggleSavedTask(id);
  }, [id, toggleSavedTask]);

  // Get task display values
  const taskTitle = (task?.title?.trim()) || ((task as any)?.name?.trim()) || (isArabic ? 'بدون عنوان' : 'No title');
  const taskDescription = (task?.description?.trim()) || ((task as any)?.details?.trim()) || (isArabic ? 'لا يوجد وصف' : 'No description');
  const taskLocation = (task?.location?.trim()) || ((task as any)?.address?.trim()) || (isArabic ? 'غير محدد' : 'Not specified');
  const taskDate = (task?.date?.trim()) || ((task as any)?.scheduledDate?.trim()) || '';
  const taskTime = (task?.time?.trim()) || ((task as any)?.scheduledTime?.trim()) || '';

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b]">
        <Skeleton className="h-72 w-full" />
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isArabic ? 'خطأ في جلب البيانات' : 'Error loading task'}
          </h3>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
            {isArabic ? 'حدث خطأ أثناء جلب معلومات المهمة' : 'An error occurred while loading task information'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 h-12 rounded-2xl bg-zinc-800 text-zinc-300 font-medium transition-colors hover:bg-zinc-700"
            >
              {isArabic ? 'رجوع' : 'Go back'}
            </button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/tasks', id] })}
              className="flex-1 h-12 rounded-2xl bg-white text-black font-medium transition-transform active:scale-[0.98]"
            >
              {isArabic ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Not Found State
  if (!task) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isArabic ? 'المهمة غير موجودة' : 'Task not found'}
          </h3>
          <p className="text-zinc-500 mb-8 text-sm">
            {isArabic ? 'قد تكون هذه المهمة قد تم حذفها' : 'This task may have been removed'}
          </p>
          <Link href="/home">
            <button className="h-12 px-8 rounded-2xl bg-white text-black font-medium transition-transform active:scale-[0.98]">
              {isArabic ? 'العودة للرئيسية' : 'Go back home'}
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const catInfo = getCategoryInfo(task.category);
  const categoryDisplay = catInfo?.subcategory 
    ? (isArabic ? catInfo.subcategory.nameAr : catInfo.subcategory.nameEn)
    : catInfo 
      ? (isArabic ? TASK_CATEGORIES_WITH_SUBS[catInfo.mainCategory]?.nameAr : TASK_CATEGORIES_WITH_SUBS[catInfo.mainCategory]?.nameEn)
      : task.category;

  // Determine visibility based on status
  const isActiveTask = task.status === 'assigned' || task.status === 'in_progress';
  const showOffersSection = task.status === 'open' && isTaskOwner && bids && bids.length > 0 && bids.some(bid => bid.tasker?.id);
  
  // Get the relevant contact person for the bottom bar
  const contactPerson = isClient && task.tasker ? task.tasker : (isTasker && task.client ? task.client : null);

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-28">
      {/* Immersive Map Header */}
      <div className="relative">
        <div className="sticky top-0 z-10">
          {/* Floating Header Controls */}
          <div className="absolute top-safe left-0 right-0 z-20 px-4 pt-3">
            <div className="flex items-center justify-between">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>

              <div className="flex items-center gap-2">
                {isTasker && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleSave}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10"
                  >
                    <Heart className={cn("w-5 h-5 transition-all", isSaved ? "fill-red-500 text-red-500" : "text-white")} />
                  </motion.button>
                )}
                {isClient && task.status === 'open' && (
                  <>
                    <Link href={`/task/${id}/edit`}>
                      <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10"
                      >
                        <Edit3 className="w-5 h-5 text-white" />
                      </motion.button>
                    </Link>
                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteModal(true)}
                      className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-xl flex items-center justify-center border border-red-500/30"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <TaskLocationMap
            latitude={task.latitude}
            longitude={task.longitude}
            location={taskLocation}
            className="rounded-none h-72"
            category={task.category}
            showExactLocation={isTaskOwner || isAssignedTasker}
          />

          {/* Gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-20 -mt-8 px-5"
      >
        {/* Status & Category Pills */}
        <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", statusConfig.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot)} />
            {statusConfig.label}
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-400">
            {categoryDisplay}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 
          variants={fadeInUp}
          className="text-2xl font-bold text-white mb-2 leading-tight tracking-tight"
        >
          {taskTitle}
        </motion.h1>

        {/* Budget - Hero Element */}
        <motion.div variants={fadeInUp} className="mb-4">
          <p className="text-3xl font-bold text-white tracking-tight">
            {task.budget && parseFloat(String(task.budget)) > 0 
              ? formatTaskCurrency(task.budget)
              : (isArabic ? 'قابل للتفاوض' : 'Negotiable')}
          </p>
        </motion.div>

        {/* Consolidated Meta Info - Single Sleek Row */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <span className="truncate max-w-[140px]">{taskLocation}</span>
          </div>
          <span className="text-zinc-700">·</span>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>{taskDate || (isArabic ? 'مرن' : 'Flexible')}</span>
            {taskTime && <span className="text-zinc-600">• {taskTime}</span>}
          </div>
        </motion.div>

        {/* Description */}
        <motion.p 
          variants={fadeInUp}
          className="text-zinc-400 text-base leading-relaxed mb-8"
        >
          {taskDescription}
        </motion.p>

        {/* Executor Card - Show for active tasks (assigned/in_progress) */}
        {isActiveTask && task.tasker && (
          <motion.div variants={fadeInUp} className="mb-6">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-3 px-1">
              {isArabic ? 'المنفذ' : 'Executor'}
            </p>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 ring-2 ring-zinc-700">
                  <AvatarImage src={task.tasker.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold text-lg">
                    {task.tasker.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-lg truncate">{task.tasker.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm text-zinc-300 font-medium">{parseFloat(String(task.tasker.rating || 0)).toFixed(1)}</span>
                    </div>
                    {task.tasker.completedTasks && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="text-sm text-zinc-500">{task.tasker.completedTasks} {isArabic ? 'مهمة' : 'completed'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status indicator for in_progress (Waiting for Payment) */}
              {task.status === 'in_progress' && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    {isArabic ? 'في انتظار الدفع' : 'Waiting for Payment'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Client Info - Only show for tasker when NOT the task owner */}
        {isTasker && task.client && !isTaskOwner && !isActiveTask && (
          <motion.div variants={fadeInUp} className="mb-6">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-3 px-1">
              {isArabic ? 'صاحب المهمة' : 'Posted by'}
            </p>
            <div className="p-4 rounded-2xl bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-zinc-800">
                  <AvatarImage src={task.client.avatar || undefined} />
                  <AvatarFallback className="bg-zinc-800 text-white font-semibold">
                    {task.client.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{task.client.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-zinc-400">{parseFloat(String(task.client.rating || 0)).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Offers Section - ONLY for open tasks */}
        {showOffersSection && (
          <motion.div variants={fadeInUp} className="mb-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
                {isArabic ? 'العروض المقدمة' : 'Offers'}
              </p>
              <span className="text-xs font-medium text-white bg-zinc-800 px-2 py-0.5 rounded-full">
                {bids.filter(bid => bid.tasker?.id).length}
              </span>
            </div>
            <div className="space-y-3">
              {bids
                .filter(bid => bid.tasker?.id)
                .map((bid, index) => (
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

      {/* Sticky Bottom Action Bar - Glassmorphism */}
      <AnimatePresence>
        {/* Tasker - Open Task: Make Offer */}
        {isTasker && task.status === 'open' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 pb-safe">
              <button
                onClick={() => setShowBidModal(true)}
                className="w-full h-14 rounded-2xl bg-white text-black font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" />
                {isArabic ? 'تقديم عرض' : 'Make an Offer'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Tasker - Assigned: Complete + Contact */}
        {isTasker && task.status === 'assigned' && isAssignedTasker && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 pb-safe">
              <div className="flex items-center gap-3">
                {/* Primary Action Button */}
                <button
                  onClick={() => requestCompletionMutation.mutate()}
                  disabled={requestCompletionMutation.isPending}
                  className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {requestCompletionMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {isArabic ? 'إتمام المهمة' : 'Complete'}
                    </>
                  )}
                </button>
                
                {/* Call Button */}
                {task.client?.phone && (
                  <a
                    href={`tel:${task.client.phone}`}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform active:scale-95"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </a>
                )}
                
                {/* Chat Button */}
                <Link href={`/chat/${task.id}`}>
                  <button className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform active:scale-95">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tasker - In Progress (Waiting for Payment): Muted status + Reminder option */}
        {isTasker && task.status === 'in_progress' && isAssignedTasker && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 pb-safe">
              <div className="flex items-center gap-3">
                {/* Muted Waiting Status Button */}
                <button
                  onClick={() => sendReminderMutation.mutate()}
                  disabled={sendReminderMutation.isPending}
                  className="flex-1 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {sendReminderMutation.isPending ? (
                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span className="font-medium text-zinc-400 text-sm">
                        {isArabic ? 'في انتظار دفع العميل...' : 'Waiting for Client Payment...'}
                      </span>
                      <Bell className="w-4 h-4 text-zinc-500 ml-1" />
                    </>
                  )}
                </button>
                
                {/* Call Button */}
                {task.client?.phone && (
                  <a
                    href={`tel:${task.client.phone}`}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform active:scale-95"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </a>
                )}
                
                {/* Chat Button */}
                <Link href={`/chat/${task.id}`}>
                  <button className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform active:scale-95">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Client - Assigned Task: Contact Tasker */}
        {isClient && task.status === 'assigned' && isTaskOwner && task.tasker && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 pb-safe">
              <div className="flex items-center gap-3">
                {/* Primary Action - Chat */}
                <Link href={`/chat/${task.id}`} className="flex-1">
                  <button className="w-full h-14 rounded-2xl bg-white text-black font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                    <MessageCircle className="w-5 h-5" />
                    {isArabic ? 'محادثة المنفذ' : 'Chat with Tasker'}
                  </button>
                </Link>
                
                {/* Call Button */}
                {task.tasker.phone && (
                  <a
                    href={`tel:${task.tasker.phone}`}
                    className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center transition-transform active:scale-95"
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Client - Waiting for Payment: Pay Now Button */}
        {isClient && task.status === 'in_progress' && isTaskOwner && task.tasker && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 pb-safe">
              <div className="flex items-center gap-3">
                {/* Primary Action - Pay Now */}
                <button
                  onClick={() => paymentMutation.mutate()}
                  disabled={paymentMutation.isPending}
                  className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {isArabic 
                        ? `ادفع الآن (${formatTaskCurrency(task.budget)})` 
                        : `Pay Now (${formatTaskCurrency(task.budget)})`}
                    </>
                  )}
                </button>
                
                {/* Call Button */}
                {task.tasker.phone && (
                  <a
                    href={`tel:${task.tasker.phone}`}
                    className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform active:scale-95"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </a>
                )}
                
                {/* Chat Button */}
                <Link href={`/chat/${task.id}`}>
                  <button className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center transition-transform active:scale-95">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Client - Completed: Rate Tasker */}
        {isClient && task.status === 'completed' && isTaskOwner && !reviewData?.hasReview && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 pb-safe">
              <button
                onClick={() => setShowRatingModal(true)}
                className="w-full h-14 rounded-2xl bg-amber-500 text-black font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Star className="w-5 h-5" />
                {isArabic ? 'قيّم المنفذ' : 'Rate Tasker'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {/* Bid Modal */}
      <Modal
        isOpen={showBidModal}
        onClose={handleCloseBidModal}
        title={isArabic ? 'تقديم عرض' : 'Make an Offer'}
        action={
          <button
            onClick={() => placeBidMutation.mutate()}
            disabled={!bidAmount || placeBidMutation.isPending}
            className="w-full h-14 rounded-2xl bg-white text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {placeBidMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isArabic ? 'جاري الإرسال...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {isArabic ? 'إرسال العرض' : 'Send Offer'}
              </>
            )}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-500 mb-2 block">{isArabic ? 'قيمة العرض' : 'Your offer'}</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                inputMode="decimal"
                value={bidAmount}
                onChange={handleBidAmountChange}
                placeholder={isArabic ? 'أدخل قيمة العرض' : 'Enter amount'}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2 px-1">
              {isArabic ? 'ميزانية العميل:' : "Client's budget:"} <span className="text-white font-medium">{formatTaskCurrency(task.budget)}</span>
            </p>
          </div>
          <div>
            <label className="text-sm text-zinc-500 mb-2 block">{isArabic ? 'رسالة (اختياري)' : 'Message (optional)'}</label>
            <textarea
              value={bidMessage}
              onChange={handleBidMessageChange}
              placeholder={isArabic ? 'لماذا أنت مناسب لهذه المهمة؟' : 'Why are you a great fit?'}
              rows={3}
              className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title={isArabic ? 'حذف المهمة' : 'Delete Task'}
        action={
          <div className="flex gap-3">
            <button
              onClick={handleCloseDeleteModal}
              className="flex-1 h-14 rounded-2xl bg-zinc-800 text-zinc-300 font-medium transition-colors hover:bg-zinc-700"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={() => deleteTaskMutation.mutate()}
              disabled={deleteTaskMutation.isPending}
              className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              {deleteTaskMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  {isArabic ? 'حذف' : 'Delete'}
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-zinc-400 mb-2">
            {isArabic ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Are you sure you want to delete this task?'}
          </p>
          <p className="text-white font-medium">{taskTitle}</p>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title={isArabic ? 'قيّم المنفذ' : 'Rate Tasker'}
        action={
          <button
            onClick={() => submitReviewMutation.mutate()}
            disabled={selectedRating === 0 || submitReviewMutation.isPending}
            className="w-full h-14 rounded-2xl bg-amber-500 text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {submitReviewMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Star className="w-5 h-5" />
                {isArabic ? 'إرسال التقييم' : 'Submit Rating'}
              </>
            )}
          </button>
        }
      >
        <div className="space-y-6">
          {/* Tasker Preview */}
          {task.tasker && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/50">
              <Avatar className="w-12 h-12">
                <AvatarImage src={task.tasker.avatar || undefined} />
                <AvatarFallback className="bg-zinc-800 text-white font-semibold">
                  {task.tasker.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white">{task.tasker.name}</p>
                <p className="text-sm text-zinc-500">@{task.tasker.username}</p>
              </div>
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center py-4">
            <p className="text-sm text-zinc-500 mb-4">
              {isArabic ? 'كيف كانت تجربتك؟' : 'How was your experience?'}
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      "w-10 h-10 transition-colors",
                      selectedRating >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-700"
                    )}
                  />
                </button>
              ))}
            </div>
            {selectedRating > 0 && (
              <p className="text-sm font-medium text-amber-400 mt-3">
                {selectedRating === 5 ? (isArabic ? 'ممتاز!' : 'Excellent!') :
                  selectedRating === 4 ? (isArabic ? 'جيد جداً' : 'Very Good') :
                    selectedRating === 3 ? (isArabic ? 'جيد' : 'Good') :
                      selectedRating === 2 ? (isArabic ? 'مقبول' : 'Fair') :
                        (isArabic ? 'ضعيف' : 'Poor')}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm text-zinc-500 mb-2 block">
              {isArabic ? 'تعليق (اختياري)' : 'Comment (optional)'}
            </label>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder={isArabic ? 'شارك تجربتك...' : 'Share your experience...'}
              rows={3}
              className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default TaskDetailsScreen;
