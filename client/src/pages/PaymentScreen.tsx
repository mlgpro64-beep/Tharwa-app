import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, CreditCard, Shield, CheckCircle, 
  AlertCircle, Loader2, DollarSign, User, Percent
} from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

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

interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
  amount: number;
}

interface PaymentFormProps {
  taskId: string;
  task: TaskWithDetails;
  amount: number;
  onSuccess: () => void;
}

const PaymentForm = memo(function PaymentForm({ taskId, task, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const platformFee = amount * 0.05;
  const taskerPayout = amount - platformFee;

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      return apiRequest('POST', '/api/payments/confirm', {
        taskId,
        paymentIntentId,
      });
    },
    onSuccess: () => {
      toast({
        title: isArabic ? 'تم الدفع بنجاح!' : 'Payment successful!',
        description: isArabic ? 'تم إتمام المهمة والدفع للمنفذ' : 'Task completed and payment sent to tasker',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'فشل التأكيد' : 'Confirmation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + `/task/${taskId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || (isArabic ? 'حدث خطأ في الدفع' : 'Payment failed'));
        toast({
          title: isArabic ? 'فشل الدفع' : 'Payment failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        confirmPaymentMutation.mutate(paymentIntent.id);
      }
    } catch (err: any) {
      setPaymentError(err.message || (isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div variants={itemVariants} className="glass-premium rounded-[24px] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground" data-testid="text-payment-title">
              {isArabic ? 'تفاصيل الدفع' : 'Payment Details'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'أدخل بيانات البطاقة' : 'Enter your card information'}
            </p>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-white/[0.06] rounded-2xl p-4" data-testid="container-stripe-elements">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {paymentError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl p-3"
            data-testid="text-payment-error"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{paymentError}</span>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="glass rounded-[24px] p-5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          {isArabic ? 'ملخص الدفع' : 'Payment Summary'}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">{isArabic ? 'اسم المهمة' : 'Task'}</span>
            <span className="font-semibold text-foreground text-sm truncate max-w-[200px]" data-testid="text-task-title">
              {task.title}
            </span>
          </div>
          
          <div className="h-px bg-border/50" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
            </div>
            <span className="font-bold text-foreground" data-testid="text-total-amount">{formatCurrency(amount)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{isArabic ? 'رسوم المنصة (5%)' : 'Platform Fee (5%)'}</span>
            </div>
            <span className="text-muted-foreground text-sm" data-testid="text-platform-fee">{formatCurrency(platformFee)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{isArabic ? 'أرباح المنفذ' : 'Tasker Payout'}</span>
            </div>
            <span className="text-success font-semibold" data-testid="text-tasker-payout">{formatCurrency(taskerPayout)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-2 px-2">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {isArabic 
            ? 'جميع المعاملات مشفرة ومحمية بواسطة Stripe' 
            : 'All transactions are encrypted and secured by Stripe'}
        </p>
      </motion.div>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={!stripe || isProcessing || confirmPaymentMutation.isPending}
        className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2.5"
        data-testid="button-pay"
      >
        {isProcessing || confirmPaymentMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {isArabic ? 'جاري الدفع...' : 'Processing...'}
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {isArabic ? `ادفع ${formatCurrency(amount)}` : `Pay ${formatCurrency(amount)}`}
          </>
        )}
      </motion.button>
    </form>
  );
});

const PaymentScreen = memo(function PaymentScreen() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const { data: task, isLoading: taskLoading } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', id],
  });

  const { data: paymentIntent, isLoading: paymentLoading, error: paymentError } = useQuery<PaymentIntentResponse>({
    queryKey: ['/api/payments/create-intent', id],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/payments/create-intent', { taskId: id });
      return res.json();
    },
    enabled: !!task && task.status === 'in_progress',
  });

  useEffect(() => {
    if (paymentIntent?.publishableKey && !stripePromise) {
      setStripePromise(loadStripe(paymentIntent.publishableKey));
    }
  }, [paymentIntent?.publishableKey, stripePromise]);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleSuccess = useCallback(() => {
    setLocation(`/task/${id}`);
  }, [id, setLocation]);

  if (taskLoading || paymentLoading) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe px-5 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <Skeleton className="h-6 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-3xl mb-5" />
        <Skeleton className="h-32 w-full rounded-2xl mb-5" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe flex items-center justify-center px-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-premium rounded-3xl p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-task-not-found">
            {isArabic ? 'المهمة غير موجودة' : 'Task not found'}
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            {isArabic ? 'قد تكون هذه المهمة محذوفة' : 'This task may have been removed'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setLocation('/home')}
            className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
            data-testid="button-go-home"
          >
            {isArabic ? 'العودة للرئيسية' : 'Go back home'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (task.status !== 'in_progress') {
    return (
      <div className="min-h-screen gradient-mesh pt-safe flex items-center justify-center px-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-premium rounded-3xl p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-warning/15 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-payment-unavailable">
            {isArabic ? 'الدفع غير متاح' : 'Payment not available'}
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            {isArabic 
              ? 'يجب أن يطلب المنفذ إتمام المهمة قبل الدفع' 
              : 'The tasker must mark the task as complete before payment'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setLocation(`/task/${id}`)}
            className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
            data-testid="button-back-to-task"
          >
            {isArabic ? 'العودة للمهمة' : 'Back to task'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (paymentError) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe flex items-center justify-center px-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-premium rounded-3xl p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-payment-error-title">
            {isArabic ? 'خطأ في الدفع' : 'Payment Error'}
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            {isArabic ? 'تعذر إنشاء جلسة الدفع' : 'Could not create payment session'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="gradient-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
            data-testid="button-try-again"
          >
            {isArabic ? 'حاول مرة أخرى' : 'Try again'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!paymentIntent || !stripePromise) {
    return (
      <div className="min-h-screen gradient-mesh pt-safe px-5 py-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <Skeleton className="h-6 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-3xl mb-5" />
        <Skeleton className="h-32 w-full rounded-2xl mb-5" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh pt-safe pb-32" dir={isArabic ? 'rtl' : 'ltr'}>
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
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-2xl glass",
              isArabic && "order-last"
            )}
            data-testid="button-back"
          >
            <ArrowLeft className={cn("w-5 h-5 text-foreground/80", isArabic && "rotate-180")} />
          </motion.button>
          
          <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
            {isArabic ? 'إتمام الدفع' : 'Complete Payment'}
          </h1>

          <div className="w-11" />
        </motion.div>

        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[24px] mb-6">
          <div className="absolute inset-0 glass-ultra" />
          <div className="absolute inset-0 gradient-border" />
          
          <div className="relative p-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2" data-testid="text-completion-header">
              {isArabic ? 'المنفذ أتم المهمة' : 'Tasker Completed Task'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isArabic 
                ? 'قم بالدفع لتأكيد إتمام المهمة وتحويل الأرباح للمنفذ'
                : 'Complete payment to confirm task completion and release payment to tasker'}
            </p>
          </div>
        </motion.div>

        <Elements 
          stripe={stripePromise} 
          options={{
            clientSecret: paymentIntent.clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#3b5bff',
                colorBackground: 'rgba(255, 255, 255, 0.8)',
                colorText: '#1a1a2e',
                colorDanger: '#dc2626',
                fontFamily: '"Cairo", -apple-system, BlinkMacSystemFont, sans-serif',
                borderRadius: '12px',
              },
            },
            locale: isArabic ? 'ar' : 'en',
          }}
        >
          <PaymentForm 
            taskId={id!} 
            task={task} 
            amount={paymentIntent.amount}
            onSuccess={handleSuccess}
          />
        </Elements>
      </motion.div>
    </div>
  );
});

export default PaymentScreen;
