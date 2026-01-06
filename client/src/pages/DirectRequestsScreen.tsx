import { memo, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/animated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Calendar, Clock, MapPin, CheckCircle,
  XCircle, User, Phone, MessageSquare, Wallet,
  Inbox, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { TASK_CATEGORIES_WITH_SUBS, getCategoryInfo } from '@shared/schema';
import type { DirectServiceRequest, User as UserType } from '@shared/schema';

type DirectRequestWithClient = DirectServiceRequest & {
  client: UserType;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
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

const DirectRequestsScreen = memo(function DirectRequestsScreen() {
  const [, setLocation] = useLocation();
  const { user } = useApp();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const isArabic = i18n.language === 'ar';

  const { data: requests, isLoading } = useQuery<DirectRequestWithClient[]>({
    queryKey: ['/api/direct-requests'],
    enabled: !!user && user.role === 'tasker',
  });

  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest('POST', `/api/direct-requests/${requestId}/accept`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/direct-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: isArabic ? 'تم قبول الطلب' : 'Request Accepted',
        description: isArabic
          ? 'تم إنشاء المهمة بنجاح. يمكنك الآن بدء العمل.'
          : 'Task created successfully. You can start working now.',
      });
      if (data.task?.id) {
        setLocation(`/task/${data.task.id}`);
      }
    },
    onError: () => {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic
          ? 'حدث خطأ أثناء قبول الطلب'
          : 'An error occurred while accepting the request',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest('POST', `/api/direct-requests/${requestId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/direct-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: isArabic ? 'تم رفض الطلب' : 'Request Rejected',
        description: isArabic
          ? 'تم رفض طلب الخدمة المباشرة'
          : 'Direct service request rejected',
      });
    },
    onError: () => {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic
          ? 'حدث خطأ أثناء رفض الطلب'
          : 'An error occurred while rejecting the request',
        variant: 'destructive',
      });
    },
  });

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const historyRequests = requests?.filter(r => r.status !== 'pending') || [];
  const displayRequests = activeTab === 'pending' ? pendingRequests : historyRequests;

  const getCategoryName = (category: string) => {
    const info = getCategoryInfo(category);
    if (!info) return category;

    const mainCat = TASK_CATEGORIES_WITH_SUBS[info.mainCategory];
    if (info.subcategory) {
      return isArabic ? info.subcategory.nameAr : info.subcategory.nameEn;
    }
    return isArabic ? mainCat.nameAr : mainCat.nameEn;
  };

  const getCategoryColor = (category: string) => {
    const info = getCategoryInfo(category);
    if (!info) return '#6B7280';
    return TASK_CATEGORIES_WITH_SUBS[info.mainCategory].colorHex;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return format(d, 'EEEE, d MMMM yyyy', {
      locale: isArabic ? ar : enUS
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          text: isArabic ? 'تم القبول' : 'Accepted',
          color: 'bg-success/15 text-success',
          icon: CheckCircle,
        };
      case 'rejected':
        return {
          text: isArabic ? 'تم الرفض' : 'Rejected',
          color: 'bg-destructive/15 text-destructive',
          icon: XCircle,
        };
      case 'cancelled':
        return {
          text: isArabic ? 'ملغى' : 'Cancelled',
          color: 'bg-muted text-muted-foreground',
          icon: AlertCircle,
        };
      default:
        return {
          text: isArabic ? 'قيد الانتظار' : 'Pending',
          color: 'bg-warning/15 text-warning',
          icon: Clock,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe px-5 py-5">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="w-11 h-11 rounded-2xl" />
          <Skeleton className="h-8 w-40 rounded-lg" />
          <div className="w-11" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 mb-4 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-20 -right-24 w-72 h-72 bg-gradient-to-br from-accent/25 to-accent/5 rounded-full blur-3xl rtl:-left-24 rtl:right-auto"
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
            onClick={() => window.history.back()}
            className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/80 rtl:rotate-180" />
          </motion.button>

          <h1 className="text-xl font-bold text-foreground">
            {isArabic ? 'طلبات الخدمة المباشرة' : 'Direct Service Requests'}
          </h1>

          <div className="w-11" />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex gap-2 mb-6"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('pending')}
            className={cn(
              "flex-1 h-12 rounded-2xl font-semibold text-sm transition-all duration-200",
              activeTab === 'pending'
                ? "gradient-primary text-white shadow-lg shadow-primary/25"
                : "glass text-muted-foreground"
            )}
            data-testid="tab-pending"
          >
            {isArabic ? 'قيد الانتظار' : 'Pending'} ({pendingRequests.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 h-12 rounded-2xl font-semibold text-sm transition-all duration-200",
              activeTab === 'history'
                ? "gradient-primary text-white shadow-lg shadow-primary/25"
                : "glass text-muted-foreground"
            )}
            data-testid="tab-history"
          >
            {isArabic ? 'السجل' : 'History'} ({historyRequests.length})
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {displayRequests.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <Inbox className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {activeTab === 'pending'
                  ? (isArabic ? 'لا توجد طلبات جديدة' : 'No Pending Requests')
                  : (isArabic ? 'لا توجد سجلات' : 'No History')}
              </h3>
              <p className="text-muted-foreground text-sm">
                {activeTab === 'pending'
                  ? (isArabic
                    ? 'عندما يطلب العملاء خدماتك مباشرة، ستظهر هنا'
                    : "When clients request your services directly, they'll appear here")
                  : (isArabic
                    ? 'الطلبات المقبولة والمرفوضة ستظهر هنا'
                    : 'Accepted and rejected requests will appear here')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {displayRequests.map((request, index) => {
                const status = getStatusBadge(request.status);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-3xl overflow-hidden"
                    data-testid={`direct-request-card-${request.id}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white/20">
                            <AvatarImage src={request.client?.avatar || undefined} />
                            <AvatarFallback className="gradient-primary text-white font-bold">
                              {request.client?.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-foreground">
                              {request.client?.name || 'Client'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              @{request.client?.username}
                            </p>
                          </div>
                        </div>

                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                          status.color
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.text}
                        </div>
                      </div>

                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                        style={{
                          backgroundColor: `${getCategoryColor(request.category)}20`,
                          color: getCategoryColor(request.category)
                        }}
                      >
                        {getCategoryName(request.category)}
                      </div>

                      <p className="text-foreground mb-4 text-sm leading-relaxed">
                        {request.description}
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-foreground">{formatDate(request.scheduledDate)}</span>
                        </div>

                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-foreground">{request.scheduledTime}</span>
                        </div>

                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-foreground">{request.location}</span>
                        </div>

                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-success" />
                          </div>
                          <span className="text-foreground font-semibold">
                            {formatCurrency(request.budget)}
                          </span>
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-3 mt-5 pt-5 border-t border-border/30">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => rejectMutation.mutate(request.id)}
                            disabled={rejectMutation.isPending || acceptMutation.isPending}
                            className="flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-destructive/10 text-destructive disabled:opacity-50"
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="w-5 h-5" />
                            {isArabic ? 'رفض' : 'Reject'}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => acceptMutation.mutate(request.id)}
                            disabled={rejectMutation.isPending || acceptMutation.isPending}
                            className="flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 gradient-primary text-white shadow-lg shadow-primary/25 disabled:opacity-50"
                            data-testid={`button-accept-${request.id}`}
                          >
                            <CheckCircle className="w-5 h-5" />
                            {isArabic ? 'قبول' : 'Accept'}
                          </motion.button>
                        </div>
                      )}

                      {request.status !== 'pending' && (
                        <div className="flex gap-3 mt-5 pt-5 border-t border-border/30">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocation(`/profile/${request.clientId}`)}
                            className="flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 glass text-foreground"
                            data-testid={`button-view-client-${request.id}`}
                          >
                            <User className="w-4 h-4" />
                            {isArabic ? 'عرض الملف الشخصي' : 'View Profile'}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

export default DirectRequestsScreen;
