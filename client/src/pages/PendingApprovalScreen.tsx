import { memo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { Clock, RefreshCw, LogOut, CheckCircle, Zap } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

const PendingApprovalScreen = memo(function PendingApprovalScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useApp();
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  const { data: currentUser, refetch } = useQuery<User>({
    queryKey: ['/api/users/me'],
    refetchInterval: 10000,
  });

  const autoApproveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/users/auto-approve');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: isArabic ? 'تم الاعتماد بنجاح!' : 'Approved successfully!',
        description: isArabic ? 'تم اعتماد حسابك كمنفذ' : 'Your account has been approved as a tasker',
      });
      setTimeout(() => {
        setLocation('/home');
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.verificationStatus === 'approved') {
        setLocation('/home');
      }
    }
  }, [currentUser, setUser, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleAutoApprove = () => {
    autoApproveMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="absolute bottom-40 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        <div className="glass rounded-3xl p-8 text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="w-12 h-12 text-warning" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {isArabic ? 'جاري مراجعة حسابك' : 'Account Under Review'}
          </h1>
          
          <p className="text-muted-foreground leading-relaxed">
            {isArabic 
              ? 'شكراً لتسجيلك كمنفذ. فريقنا يراجع طلبك حالياً وسيتم إشعارك فور الموافقة على حسابك.'
              : 'Thank you for registering as a tasker. Our team is currently reviewing your application and you will be notified once your account is approved.'}
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground text-start">
              <p className="font-medium text-foreground mb-1">
                {isArabic ? 'ماذا يحدث الآن؟' : 'What happens now?'}
              </p>
              <ul className="space-y-1">
                <li>{isArabic ? '• مراجعة بياناتك وشهادتك' : '• Your information and certificate are being reviewed'}</li>
                <li>{isArabic ? '• ستتلقى إشعاراً عند الموافقة' : '• You will receive a notification upon approval'}</li>
                <li>{isArabic ? '• عادةً ما يستغرق 24-48 ساعة' : '• Usually takes 24-48 hours'}</li>
              </ul>
            </div>
          </div>
        </div>

        {isDevelopment && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAutoApprove}
            disabled={autoApproveMutation.isPending}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-accent text-white flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/30 disabled:opacity-50"
            data-testid="button-auto-approve"
          >
            <Zap className="w-5 h-5" />
            <span>{isArabic ? 'اعتماد تلقائي (تطوير)' : 'Auto Approve (Dev)'}</span>
          </motion.button>
        )}

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className="flex-1 py-4 px-6 rounded-2xl glass flex items-center justify-center gap-2 font-medium"
            data-testid="button-refresh-status"
          >
            <RefreshCw className="w-5 h-5" />
            <span>{isArabic ? 'تحديث الحالة' : 'Refresh Status'}</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="py-4 px-6 rounded-2xl glass flex items-center justify-center gap-2 text-muted-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {isArabic 
            ? 'هل لديك أسئلة؟ تواصل معنا عبر صفحة المساعدة'
            : 'Have questions? Contact us through the help page'}
        </p>
      </motion.div>
    </div>
  );
});

export default PendingApprovalScreen;
