import { useState, memo, useCallback, useRef } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, EyeOff, Loader2, User, Mail, Phone, Lock, Upload, FileCheck, AlertCircle, X } from 'lucide-react';
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

type TaskerType = 'general' | 'specialized';

const RegisterScreen = memo(function RegisterScreen() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { t, i18n } = useTranslation();
  const { userRole, setUser } = useApp();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const searchParams = new URLSearchParams(searchString);
  const taskerType = (searchParams.get('taskerType') as TaskerType) || 'general';
  const isSpecialized = userRole === 'tasker' && taskerType === 'specialized';
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCertificateStep, setShowCertificateStep] = useState(false);
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (data: FormData & { certificateUrl?: string }) => {
      const requestData: Record<string, unknown> = {
        ...data,
        username: data.phone,
        role: userRole,
      };
      
      if (userRole === 'tasker') {
        requestData.taskerType = taskerType;
        requestData.verificationStatus = taskerType === 'specialized' ? 'pending' : 'approved';
        if (data.certificateUrl) {
          requestData.certificateUrl = data.certificateUrl;
        }
      }
      
      const response = await apiRequest('POST', '/api/auth/register', requestData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem('userId', data.user.id);
      
      if (isSpecialized) {
        toast({ 
          title: t('auth.accountCreatedPending'), 
          description: t('auth.pendingReviewDesc') 
        });
      } else {
        toast({ 
          title: t('auth.accountCreated'), 
          description: t('auth.welcomeTo', { appName: t('welcome.title') }) 
        });
      }
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

  const handleFormSubmit = useCallback(() => {
    if (validateForm()) {
      if (isSpecialized && !showCertificateStep) {
        setShowCertificateStep(true);
      } else {
        registerMutation.mutate({ ...formData, certificateUrl: certificateImage || undefined });
      }
    }
  }, [validateForm, isSpecialized, showCertificateStep, registerMutation, formData, certificateImage]);

  const handleSkipCertificate = useCallback(() => {
    registerMutation.mutate({ ...formData, certificateUrl: undefined });
  }, [registerMutation, formData]);

  const handleChange = useCallback((field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleBack = useCallback(() => {
    if (showCertificateStep) {
      setShowCertificateStep(false);
    } else if (userRole === 'tasker') {
      setLocation('/tasker-type');
    } else {
      setLocation('/role');
    }
  }, [setLocation, userRole, showCertificateStep]);

  const handleCertificateUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCertificateError(t('taskerType.certificate.fileTooLarge'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setCertificateError(t('taskerType.certificate.invalidFormat'));
      return;
    }

    setCertificateError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCertificateImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const removeCertificateImage = useCallback(() => {
    setCertificateImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const currentStep = showCertificateStep ? 2 : 1;
  const totalSteps = isSpecialized ? 3 : 2;

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
          {Array.from({ length: totalSteps + 1 }).map((_, step) => (
            <motion.div 
              key={step}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: step * 0.1 }}
              className={cn(
                "w-10 h-1.5 rounded-full transition-colors",
                step <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        
        <div className="w-11" />
      </motion.div>

      <div className="flex-1 flex flex-col px-6 py-6 relative z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!showCertificateStep ? (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              className="flex-1 flex flex-col"
            >
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
                  onClick={handleFormSubmit}
                  disabled={registerMutation.isPending}
                  className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  data-testid="button-create-account"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('auth.creatingAccount')}
                    </>
                  ) : isSpecialized ? (
                    t('common.next')
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
            </motion.div>
          ) : (
            <motion.div
              key="certificate-step"
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              className="flex-1 flex flex-col"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn("mb-8", isRTL && "text-right")}
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                  {t('taskerType.certificate.title')}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t('taskerType.certificate.description')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 space-y-6"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  data-testid="input-certificate"
                />

                {!certificateImage ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-3xl glass border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-4 transition-all hover:border-primary/50"
                    data-testid="button-upload-certificate"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {t('taskerType.certificate.uploadPrompt')}
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden glass"
                  >
                    <img
                      src={certificateImage}
                      alt="Certificate"
                      className="w-full h-full object-cover"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeCertificateImage}
                      className={cn(
                        "absolute top-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white",
                        isRTL ? "left-4" : "right-4"
                      )}
                      data-testid="button-remove-certificate"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground font-medium shadow-lg"
                      data-testid="button-change-certificate"
                    >
                      {t('taskerType.certificate.changeImage')}
                    </motion.button>
                  </motion.div>
                )}

                <AnimatePresence>
                  {certificateError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium">{certificateError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                >
                  <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className={cn("text-sm text-amber-700 dark:text-amber-300", isRTL && "text-right")}>
                    {t('taskerType.certificate.pendingNote')}
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 pb-safe space-y-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFormSubmit}
                  disabled={registerMutation.isPending}
                  className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  data-testid="button-submit-certificate"
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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkipCertificate}
                  disabled={registerMutation.isPending}
                  className="w-full h-14 glass text-foreground rounded-2xl font-bold text-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  data-testid="button-skip-certificate"
                >
                  {t('taskerType.certificate.skipForNow')}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default RegisterScreen;
