import { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface InputFieldProps {
  icon: typeof User;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  testId: string;
  dir?: string;
}

const InputField = memo(function InputField({
  icon: Icon,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  testId,
  dir,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="relative">
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          isRTL ? "right-4" : "left-4"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label}
          autoComplete={autoComplete}
          dir={dir || (isRTL ? 'rtl' : 'ltr')}
          className={cn(
            "w-full h-14 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200",
            isRTL ? "pr-12 pl-5" : "pl-12 pr-5",
            error && "border-destructive",
            isFocused && "ring-2 ring-primary/30",
            showPasswordToggle && (isRTL ? "pl-14" : "pr-14"),
            isRTL && "text-right"
          )}
          data-testid={testId}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors",
              isRTL ? "left-4" : "right-4"
            )}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn(
              "mt-2 text-xs text-destructive font-medium",
              isRTL ? "pr-1 text-right" : "pl-1"
            )}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

const RegisterScreen = memo(function RegisterScreen() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { userRole, setUser } = useApp();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/auth/register', {
        ...data,
        username: data.phone,
        role: userRole,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem('userId', data.user.id);
      toast({ title: t('auth.accountCreated'), description: t('auth.welcomeTo', { appName: t('welcome.title') }) });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = t('errors.required');
    if (!formData.email.trim()) {
      newErrors.email = t('errors.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('errors.required');
    } else if (!/^05\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('errors.invalidPhone');
    }
    if (!formData.password.trim()) {
      newErrors.password = t('errors.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordTooShort');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  }, [validateForm, registerMutation, formData]);

  const handleChange = useCallback((field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleBack = useCallback(() => {
    setLocation('/role');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-primary/5 pt-safe">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className={cn(
            "absolute -top-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl",
            isRTL ? "-right-20" : "-left-20"
          )}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "absolute bottom-40 w-64 h-64 bg-primary/15 rounded-full blur-3xl",
            isRTL ? "-left-20" : "-right-20"
          )}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4"
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
        
        <div className="flex gap-2">
          {[0, 1, 2].map((step) => (
            <motion.div 
              key={step}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: step * 0.1 }}
              className={cn(
                "w-10 h-1.5 rounded-full transition-colors",
                step <= 1 ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        
        <div className="w-11" />
      </motion.div>

      <div className="flex-1 flex flex-col px-6 py-6 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn("mb-8", isRTL && "text-right")}
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {t('auth.createAccount')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {userRole === 'tasker' 
              ? t('auth.taskerRegisterDesc')
              : t('auth.clientRegisterDesc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 flex-1"
        >
          <InputField
            icon={User}
            label={t('auth.fullName')}
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            autoComplete="name"
            testId="input-name"
          />
          
          <InputField
            icon={Phone}
            label={t('auth.phone')}
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            autoComplete="tel"
            testId="input-phone"
            dir="ltr"
          />
          
          <InputField
            icon={Mail}
            label={t('auth.email')}
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
            testId="input-email"
            dir="ltr"
          />
          
          <InputField
            icon={Lock}
            label={t('auth.password')}
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="new-password"
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            testId="input-password"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 pb-safe"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={registerMutation.isPending}
            className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="button-create-account"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('auth.creatingAccount')}
              </>
            ) : (
              t('auth.register')
            )}
          </motion.button>

          <p className={cn("text-center text-muted-foreground mt-6", isRTL && "text-center")}>
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
});

export default RegisterScreen;
