import { useState, memo, useCallback, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, setAuthToken } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const VerifyOTPScreen = memo(function VerifyOTPScreen() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { setUser, setLocalRole } = useApp();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isArabic = i18n.language === 'ar';

  // Get phone from URL params
  const getPhoneFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchString);
    return params.get('phone') || '';
  }, [searchString]);

  const phone = getPhoneFromUrl();

  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resend OTP mutation
  const resendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest('POST', '/api/auth/send-phone-otp', { phone: phoneNumber, type: 'login' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send OTP');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isArabic ? 'تم إرسال الرمز' : 'Code Sent',
        description: isArabic ? 'تحقق من رسائلك SMS' : 'Check your SMS for the verification code'
      });
      setOtpCode(''); // Clear current code
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Phone OTP login mutation
  const phoneOtpLoginMutation = useMutation({
    mutationFn: async (data: { phone: string; otpCode: string }) => {
      const response = await apiRequest('POST', '/api/auth/login-with-phone-otp', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setLocalRole(data.user.role);
      localStorage.setItem('userId', data.user.id);
      toast({
        title: t('auth.welcomeBack'),
        description: t('auth.welcomeBackName', { name: data.user.name })
      });
      setLocation('/home');
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        errorMessage = isArabic ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired verification code';
      }
      setErrors({ otpCode: errorMessage });
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    },
  });

  const validateOtp = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!otpCode.trim() || otpCode.length !== 6) {
      newErrors.otpCode = isArabic ? 'الرجاء إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [otpCode, isArabic]);

  const handleSubmit = useCallback(() => {
    if (!validateOtp()) return;
    phoneOtpLoginMutation.mutate({ phone, otpCode });
  }, [validateOtp, phoneOtpLoginMutation, phone, otpCode]);

  const handleBack = useCallback(() => {
    setLocation('/login');
  }, [setLocation]);

  const handleResend = useCallback(() => {
    if (phone) {
      resendOtpMutation.mutate(phone);
    }
  }, [phone, resendOtpMutation]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && Object.keys(errors).length === 0 && !phoneOtpLoginMutation.isPending && phone) {
      const timer = setTimeout(() => {
        phoneOtpLoginMutation.mutate({ phone, otpCode });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otpCode.length, phone]);

  // Redirect if no phone
  useEffect(() => {
    if (!phone) {
      const timer = setTimeout(() => {
        setLocation('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phone, setLocation]);

  const isPending = phoneOtpLoginMutation.isPending || resendOtpMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-primary/5 pt-safe">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className={cn(
            "absolute top-40 w-80 h-80 bg-primary/15 rounded-full blur-3xl",
            isRTL ? "-left-32" : "-right-32"
          )}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center px-6 py-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
          data-testid="button-back"
        >
          <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
        </motion.button>
      </motion.div>

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-20 h-20 rounded-[1.5rem] bg-success/15 flex items-center justify-center mb-8 mx-auto shadow-xl shadow-success/25"
        >
          <Smartphone className="w-10 h-10 text-success" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {isArabic ? 'تحقق من رقم الجوال' : 'Verify Phone Number'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isArabic
              ? `تم إرسال رمز التحقق إلى ${phone}`
              : `A verification code was sent to ${phone}`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 flex-1"
        >
          <div className="relative">
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => {
                  setOtpCode(value);
                  if (errors.otpCode) {
                    setErrors(prev => ({ ...prev, otpCode: '' }));
                  }
                }}
                onComplete={(value) => {
                  setOtpCode(value);
                }}
                containerClassName="gap-3"
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={cn(
                        "!h-16 !w-14 rounded-2xl text-2xl font-bold text-foreground transition-all duration-200",
                        "border-0 shadow-lg backdrop-blur-xl",
                        "bg-background/50 border-2 border-border/50",
                        errors.otpCode && "!border-destructive !bg-destructive/10",
                        !errors.otpCode && "hover:border-primary/50 hover:bg-primary/5",
                        "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary"
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <AnimatePresence>
              {errors.otpCode && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-3 text-xs text-destructive font-medium text-center"
                >
                  {errors.otpCode}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center space-y-3">
            <button
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
              className="text-sm text-primary font-semibold hover:underline disabled:opacity-50"
              data-testid="button-resend-code"
            >
              {isArabic ? 'إعادة إرسال الرمز' : 'Resend code'}
            </button>

            {/* Development-only skip button */}
            {import.meta.env.DEV && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    // In dev mode, server accepts any OTP code
                    phoneOtpLoginMutation.mutate({ phone, otpCode: '123456' });
                  }}
                  disabled={phoneOtpLoginMutation.isPending}
                  className="text-xs text-orange-500 font-bold hover:underline disabled:opacity-50 px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10"
                  data-testid="button-skip-otp-dev"
                >
                  🛠️ {isArabic ? 'تخطي OTP (تطوير فقط)' : 'SKIP OTP (DEV ONLY)'}
                </button>
                <p className="text-xs text-muted-foreground mt-1">
                  {isArabic ? 'أي رمز سيُقبل في وضع التطوير' : 'Any code will be accepted in dev mode'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pb-safe"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isPending || otpCode.length !== 6}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="button-verify"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              isArabic ? 'تحقق' : 'Verify'
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
});

export default VerifyOTPScreen;

