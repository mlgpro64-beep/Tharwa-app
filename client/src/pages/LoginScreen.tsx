import { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn, Eye, EyeOff, Loader2, Mail, KeyRound, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoginMode = 'password' | 'otp';

interface FormData {
  username: string;
  password: string;
  email: string;
  otpCode: string;
}

const LoginScreen = memo(function LoginScreen() {
  const [, setLocation] = useLocation();
  const { setUser, switchRole } = useApp();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isArabic = i18n.language === 'ar';
  
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    email: '',
    otpCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      switchRole(data.user.role);
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

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/auth/send-otp', { email, type: 'login' });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({ 
        title: isArabic ? 'تم إرسال الرمز' : 'Code Sent', 
        description: isArabic ? 'تحقق من بريدك الإلكتروني' : 'Check your email for the verification code'
      });
    },
    onError: (error: Error) => {
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
    },
  });

  // OTP login mutation
  const otpLoginMutation = useMutation({
    mutationFn: async (data: { email: string; otpCode: string }) => {
      const response = await apiRequest('POST', '/api/auth/login-with-otp', data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      switchRole(data.user.role);
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

  const validatePasswordForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = t('errors.required');
    if (!formData.password.trim()) newErrors.password = t('errors.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const validateOtpForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = t('errors.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isArabic ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    }
    if (otpSent && !formData.otpCode.trim()) {
      newErrors.otpCode = t('errors.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, otpSent, t, isArabic]);

  const handlePasswordSubmit = useCallback(() => {
    if (validatePasswordForm()) {
      loginMutation.mutate({ username: formData.username, password: formData.password });
    }
  }, [validatePasswordForm, loginMutation, formData]);

  const handleOtpSubmit = useCallback(() => {
    if (!validateOtpForm()) return;
    
    if (!otpSent) {
      sendOtpMutation.mutate(formData.email);
    } else {
      otpLoginMutation.mutate({ email: formData.email, otpCode: formData.otpCode });
    }
  }, [validateOtpForm, otpSent, sendOtpMutation, otpLoginMutation, formData]);

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

  const switchMode = useCallback((mode: LoginMode) => {
    setLoginMode(mode);
    setOtpSent(false);
    setErrors({});
    setFormData({ username: '', password: '', email: '', otpCode: '' });
  }, []);

  const isPending = loginMutation.isPending || sendOtpMutation.isPending || otpLoginMutation.isPending;

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
            {t('auth.haveAccount')}
          </p>
        </motion.div>

        {/* Login Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 p-1.5 rounded-2xl glass mb-6"
        >
          <button
            onClick={() => switchMode('password')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all",
              loginMode === 'password' 
                ? "gradient-primary text-white shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-mode-password"
          >
            <KeyRound className="w-4 h-4" />
            {isArabic ? 'كلمة المرور' : 'Password'}
          </button>
          <button
            onClick={() => switchMode('otp')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all",
              loginMode === 'otp' 
                ? "gradient-primary text-white shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-mode-otp"
          >
            <Smartphone className="w-4 h-4" />
            {isArabic ? 'رمز التحقق' : 'OTP'}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5 flex-1"
        >
          <AnimatePresence mode="wait">
            {loginMode === 'password' ? (
              <motion.div
                key="password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="relative">
                  <motion.input
                    type="text"
                    value={formData.username}
                    onChange={handleChange('username')}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('auth.phoneOrEmail')}
                    autoComplete="username"
                    className={cn(
                      "w-full h-16 px-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200 text-start",
                      errors.username && "border-destructive",
                      focusedField === 'username' && "ring-2 ring-primary/30"
                    )}
                    data-testid="input-username"
                  />
                  <AnimatePresence>
                    {errors.username && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-xs text-destructive font-medium"
                      >
                        {errors.username}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="relative">
                  <motion.input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('auth.password')}
                    autoComplete="current-password"
                    className={cn(
                      "w-full h-16 ps-5 pe-14 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200 text-start",
                      errors.password && "border-destructive",
                      focusedField === 'password' && "ring-2 ring-primary/30"
                    )}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-xs text-destructive font-medium"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-start">
                  <button className="text-sm text-primary font-semibold hover:underline">
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="relative">
                  <div className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-5 h-5" />
                  </div>
                  <motion.input
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={isArabic ? 'البريد الإلكتروني' : 'Email address'}
                    autoComplete="email"
                    disabled={otpSent}
                    className={cn(
                      "w-full h-16 ps-14 pe-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200 text-start",
                      errors.email && "border-destructive",
                      focusedField === 'email' && "ring-2 ring-primary/30",
                      otpSent && "opacity-60"
                    )}
                    data-testid="input-email"
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-xs text-destructive font-medium"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

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
                          <Mail className="w-8 h-8 text-success" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isArabic 
                            ? `تم إرسال رمز التحقق إلى ${formData.email}` 
                            : `A verification code was sent to ${formData.email}`}
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
                          onClick={() => sendOtpMutation.mutate(formData.email)}
                          disabled={sendOtpMutation.isPending}
                          className="text-sm text-primary font-semibold hover:underline disabled:opacity-50"
                        >
                          {isArabic ? 'إعادة إرسال الرمز' : 'Resend code'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            onClick={loginMode === 'password' ? handlePasswordSubmit : handleOtpSubmit}
            disabled={isPending}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="button-sign-in"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.loading')}
              </>
            ) : loginMode === 'otp' && !otpSent ? (
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
