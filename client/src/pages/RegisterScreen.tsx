import { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Loader2, User, Mail, Phone, AtSign, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  email: string;
  phone: string;
  username: string;
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
  optional?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  testId: string;
}

const InputField = memo(function InputField({
  icon: Icon,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  optional,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  testId,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`${label}${optional ? ' (Optional)' : ''}`}
          autoComplete={autoComplete}
          className={cn(
            "w-full h-14 pl-12 pr-5 rounded-2xl glass-input text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200",
            error && "border-destructive",
            isFocused && "ring-2 ring-primary/30",
            showPasswordToggle && "pr-14"
          )}
          data-testid={testId}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
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
            className="mt-2 text-xs text-destructive font-medium pl-1"
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
  const { t } = useTranslation();
  const { userRole, setUser } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/auth/register', {
        ...data,
        role: userRole,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem('userId', data.user.id);
      toast({ title: t('auth.accountCreated', 'Account created!'), description: t('auth.welcomeTo', { appName: t('welcome.title') }) });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
          className="absolute -top-20 -left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-40 -right-20 w-64 h-64 bg-primary/15 rounded-full blur-3xl"
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
          <ArrowLeft className="w-5 h-5" />
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
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground text-lg">
            {userRole === 'tasker' 
              ? "Start earning by helping others" 
              : "Get things done with local help"}
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
            label="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            autoComplete="name"
            testId="input-name"
          />
          
          <InputField
            icon={Mail}
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
            testId="input-email"
          />
          
          <InputField
            icon={Phone}
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            autoComplete="tel"
            optional
            testId="input-phone"
          />
          
          <InputField
            icon={AtSign}
            label="Username"
            value={formData.username}
            onChange={handleChange('username')}
            error={errors.username}
            autoComplete="username"
            testId="input-username"
          />
          
          <InputField
            icon={Lock}
            label="Password"
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </motion.button>

          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
});

export default RegisterScreen;
