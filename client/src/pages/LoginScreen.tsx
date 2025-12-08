import { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, setAuthToken } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn, Loader2, Smartphone, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  phone: string;
  otpCode: string;
}

const LoginScreen = memo(function LoginScreen() {
  const [, setLocation] = useLocation();
  const { setUser, setLocalRole } = useApp();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isArabic = i18n.language === 'ar';
  
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    otpCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Send Phone OTP mutation
  const sendPhoneOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('POST', '/api/auth/send-phone-otp', { phone, type: 'login' });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({ 
        title: isArabic ? 'تم إرسال الرمز' : 'Code Sent', 
        description: isArabic ? 'تحقق من رسائلك SMS' : 'Check your SMS for the verification code'
      });
    },
    onError: (error: Error) => {
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
    },
  });

  // Phone OTP login mutation
  const phoneOtpLoginMutation = useMutation({
    mutationFn: async (data: { phone: string; otpCode: string }) => {
      const response = await apiRequest('POST', '/api/auth/login-with-phone-otp', data);
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
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
    },
  });

  const validatePhoneForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) {
      newErrors.phone = t('errors.required');
    } else {
      const cleaned = formData.phone.replace(/[\s\-\(\)\.]/g, '');
      const patterns = [/^05\d{8}$/, /^5\d{8}$/, /^9665\d{8}$/, /^\+9665\d{8}$/];
      if (!patterns.some(p => p.test(cleaned))) {
        newErrors.phone = isArabic ? 'رقم جوال سعودي غير صالح' : 'Invalid Saudi phone number';
      }
    }
    if (otpSent && !formData.otpCode.trim()) {
      newErrors.otpCode = t('errors.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, otpSent, t, isArabic]);

  const handleSubmit = useCallback(() => {
    if (!validatePhoneForm()) return;
    
    if (!otpSent) {
      sendPhoneOtpMutation.mutate(formData.phone);
    } else {
      phoneOtpLoginMutation.mutate({ phone: formData.phone, otpCode: formData.otpCode });
    }
  }, [validatePhoneForm, otpSent, sendPhoneOtpMutation, phoneOtpLoginMutation, formData]);

  const handleChange = useCallback((field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleBack = useCallback(() => {
    if (otpSent) {
      setOtpSent(false);
      setFormData(prev => ({ ...prev, otpCode: '' }));
    } else {
      setLocation('/');
    }
  }, [setLocation, otpSent]);

  const isPending = sendPhoneOtpMutation.isPending || phoneOtpLoginMutation.isPending;

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
          className="w-20 h-20 rounded-[1.5rem] gradient-primary flex items-center justify-center mb-8 mx-auto shadow-xl shadow-primary/25"
        >
          <LogIn className="w-10 h-10 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {t('auth.login')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isArabic ? 'سجل دخولك برقم الجوال' : 'Sign in with your phone number'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5 flex-1"
        >
          {/* Phone Number Input */}
          <div className="relative">
            <div className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Phone className="w-5 h-5" />
            </div>
            <motion.input
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="05XXXXXXXX"
              autoComplete="tel"
              disabled={otpSent}
              dir="ltr"
              className={cn(
                "w-full h-16 ps-14 pe-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200",
                errors.phone && "border-destructive",
                focusedField === 'phone' && "ring-2 ring-primary/30",
                otpSent && "opacity-60"
              )}
              data-testid="input-phone"
            />
            <AnimatePresence>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 text-xs text-destructive font-medium"
                >
                  {errors.phone}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {isArabic ? 'أدخل رقم جوال سعودي (يبدأ بـ 05)' : 'Enter Saudi mobile number (starts with 05)'}
          </p>

          {/* OTP Input - Shows after code is sent */}
          <AnimatePresence>
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-success/15 flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic 
                      ? `تم إرسال رمز التحقق إلى ${formData.phone}` 
                      : `A verification code was sent to ${formData.phone}`}
                  </p>
                </div>

                <div className="relative">
                  <motion.input
                    type="text"
                    inputMode="numeric"
                    value={formData.otpCode}
                    onChange={handleChange('otpCode')}
                    onFocus={() => setFocusedField('otpCode')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={isArabic ? 'أدخل رمز التحقق' : 'Enter verification code'}
                    maxLength={6}
                    autoComplete="one-time-code"
                    className={cn(
                      "w-full h-16 px-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200 text-center text-2xl tracking-[0.5em] font-bold",
                      errors.otpCode && "border-destructive",
                      focusedField === 'otpCode' && "ring-2 ring-primary/30"
                    )}
                    data-testid="input-otp-code"
                  />
                  <AnimatePresence>
                    {errors.otpCode && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-xs text-destructive font-medium text-center"
                      >
                        {errors.otpCode}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => sendPhoneOtpMutation.mutate(formData.phone)}
                    disabled={sendPhoneOtpMutation.isPending}
                    className="text-sm text-primary font-semibold hover:underline disabled:opacity-50"
                    data-testid="button-resend-code"
                  >
                    {isArabic ? 'إعادة إرسال الرمز' : 'Resend code'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            disabled={isPending}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="button-sign-in"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.loading')}
              </>
            ) : !otpSent ? (
              isArabic ? 'إرسال رمز التحقق' : 'Send Code'
            ) : (
              t('auth.login')
            )}
          </motion.button>

          <p className="text-center text-muted-foreground mt-6">
            {t('auth.noAccount')}{' '}
            <Link href="/role" className="text-primary font-bold hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
});

export default LoginScreen;
