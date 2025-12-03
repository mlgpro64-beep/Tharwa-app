import { memo, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Clock, CheckCircle2, XCircle, MapPin, Calendar, DollarSign, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { DirectServiceRequest, User } from '@shared/schema';
import { TASK_CATEGORIES_WITH_SUBS } from '@shared/schema';

type DirectRequestWithUsers = DirectServiceRequest & {
  client: Omit<User, 'password'> | null;
  tasker: Omit<User, 'password'> | null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const MyDirectRequestsScreen = memo(function MyDirectRequestsScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';

  const { data: requests, isLoading } = useQuery<DirectRequestWithUsers[]>({
    queryKey: ['/api/direct-requests'],
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest('POST', `/api/direct-requests/${requestId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/direct-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: isArabic ? 'تم إلغاء الطلب' : 'Request Cancelled',
        description: isArabic ? 'تم إلغاء طلب الخدمة بنجاح' : 'Your service request has been cancelled',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'فشل الإلغاء' : 'Failed to cancel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const statusConfig = {
    pending: { 
      icon: Clock, 
      color: 'text-warning', 
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      label: isArabic ? 'قيد الانتظار' : 'Pending'
    },
    accepted: { 
      icon: CheckCircle2, 
      color: 'text-success', 
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      label: isArabic ? 'مقبول' : 'Accepted'
    },
    rejected: { 
      icon: XCircle, 
      color: 'text-destructive', 
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      label: isArabic ? 'مرفوض' : 'Rejected'
    },
    cancelled: { 
      icon: XCircle, 
      color: 'text-muted-foreground', 
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted/30',
      label: isArabic ? 'ملغي' : 'Cancelled'
    },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl rtl:-left-32 rtl:right-auto"
        />
      </div>

      <div className="relative z-10 px-5 py-5">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation('/')}
            className="w-10 h-10 flex items-center justify-center rounded-xl glass"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground rtl:rotate-180" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isArabic ? 'طلباتي المباشرة' : 'My Direct Requests'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'الطلبات المرسلة للمنفذين' : 'Requests sent to taskers'}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="glass rounded-[20px] p-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted/30" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted/30 rounded w-1/2" />
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-4 bg-muted/30 rounded w-1/3" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : requests && requests.length > 0 ? (
            requests.map((request, index) => {
              const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;
              const category = TASK_CATEGORIES_WITH_SUBS[request.category as keyof typeof TASK_CATEGORIES_WITH_SUBS];

              return (
                <motion.div
                  key={request.id}
                  variants={itemVariants}
                  custom={index}
                  className={`glass rounded-[20px] p-4 border ${config.borderColor}`}
                  data-testid={`card-my-request-${request.id}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Link href={`/profile/${request.taskerId}`}>
                      <Avatar className="w-14 h-14 border-2 border-white/10 cursor-pointer">
                        <AvatarImage src={request.tasker?.avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {request.tasker?.name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link href={`/profile/${request.taskerId}`}>
                          <p className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                            {request.tasker?.name || (isArabic ? 'منفذ' : 'Tasker')}
                          </p>
                        </Link>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </div>
                      
                      <p className="font-semibold text-foreground mb-1">{request.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {category && (
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.colorHex }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {isArabic ? category.nameAr : category.nameEn}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-primary">
                        {request.budget} {isArabic ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(request.scheduledDate)} - {request.scheduledTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{request.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {request.status === 'accepted' && request.linkedTaskId && (
                      <Link href={`/task/${request.linkedTaskId}`} className="flex-1">
                        <Button 
                          className="w-full gradient-primary text-white rounded-xl"
                          data-testid={`button-view-task-${request.id}`}
                        >
                          <Send className="w-4 h-4 me-2" />
                          {isArabic ? 'عرض المهمة' : 'View Task'}
                        </Button>
                      </Link>
                    )}
                    
                    {request.status === 'pending' && (
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => cancelMutation.mutate(request.id)}
                        disabled={cancelMutation.isPending}
                        data-testid={`button-cancel-request-${request.id}`}
                      >
                        <X className="w-4 h-4 me-2" />
                        {isArabic ? 'إلغاء الطلب' : 'Cancel Request'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              variants={itemVariants}
              className="glass rounded-[24px] p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">
                {isArabic ? 'لا توجد طلبات' : 'No Requests'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic 
                  ? 'يمكنك طلب خدمة مباشرة من صفحة أي منفذ' 
                  : 'You can request a service directly from any tasker profile'}
              </p>
              <Link href="/search-taskers">
                <Button className="gradient-primary text-white rounded-xl" data-testid="button-find-taskers">
                  {isArabic ? 'البحث عن منفذين' : 'Find Taskers'}
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
});

export default MyDirectRequestsScreen;
