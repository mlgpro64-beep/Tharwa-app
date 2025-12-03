import { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  username: string;
  password: string;
}

const LoginScreen = memo(function LoginScreen() {
  const [, setLocation] = useLocation();
  const { setUser, switchRole } = useApp();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
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

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = t('errors.required');
    if (!formData.password.trim()) newErrors.password = t('errors.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  }, [validateForm, loginMutation, formData]);

  const handleChange = useCallback((field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleBack = useCallback(() => {
    setLocation('/');
  }, [setLocation]);

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
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {t('auth.login')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('auth.haveAccount')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5 flex-1"
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
            disabled={loginMutation.isPending}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="button-sign-in"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.loading')}
              </>
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
