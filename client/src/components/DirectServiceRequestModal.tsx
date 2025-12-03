import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { FloatingInput } from './FloatingInput';
import { DateTimePicker } from './DateTimePicker';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES_WITH_SUBS } from '@shared/schema';
import { 
  X, Calendar, Clock, MapPin, User, DollarSign, 
  FileText, Tag, Send, Loader2, CheckCircle
} from 'lucide-react';
import type { User as UserType } from '@shared/schema';

interface DirectServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasker: UserType;
}

interface RequestFormData {
  category: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  budget: string;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();
    if (data.address) {
      const { road, suburb, city, town, village, state, country } = data.address;
      const parts = [road, suburb || village || town, city, state].filter(Boolean);
      return parts.slice(0, 3).join(', ') || country || 'Unknown Location';
    }
    return 'Unknown Location';
  } catch {
    return 'Unknown Location';
  }
};

export const DirectServiceRequestModal = memo(function DirectServiceRequestModal({
  isOpen,
  onClose,
  tasker,
}: DirectServiceRequestModalProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<RequestFormData>({
    category: '',
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    latitude: null,
    longitude: null,
    budget: '',
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      return apiRequest('POST', '/api/direct-requests', {
        taskerId: tasker.id,
        ...data,
        budget: parseFloat(data.budget),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/direct-requests'] });
      toast({
        title: isArabic ? 'تم إرسال الطلب!' : 'Request Sent!',
        description: isArabic 
          ? 'سيتم إخطارك عندما يرد المنفذ' 
          : 'You will be notified when the tasker responds',
      });
      resetAndClose();
    },
    onError: (error: Error) => {
      toast({
        title: isArabic ? 'فشل الإرسال' : 'Failed to send',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetAndClose = useCallback(() => {
    setStep(1);
    setFormData({
      category: '',
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      location: '',
      latitude: null,
      longitude: null,
      budget: '',
    });
    setErrors({});
    onClose();
  }, [onClose]);

  const updateField = useCallback((field: keyof RequestFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = await reverseGeocode(latitude, longitude);
        
        updateField('location', locationName);
        updateField('latitude', latitude);
        updateField('longitude', longitude);
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [updateField]);

  const validateStep = useCallback((stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (stepNum === 1) {
      if (!formData.category) {
        newErrors.category = isArabic ? 'اختر التصنيف' : 'Select a category';
      }
    } else if (stepNum === 2) {
      if (!formData.title.trim()) {
        newErrors.title = isArabic ? 'العنوان مطلوب' : 'Title is required';
      }
      if (!formData.description.trim()) {
        newErrors.description = isArabic ? 'الوصف مطلوب' : 'Description is required';
      }
    } else if (stepNum === 3) {
      if (!formData.budget) {
        newErrors.budget = isArabic ? 'الميزانية مطلوبة' : 'Budget is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = isArabic ? 'الموقع مطلوب' : 'Location is required';
      }
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = isArabic ? 'التاريخ مطلوب' : 'Date is required';
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = isArabic ? 'الوقت مطلوب' : 'Time is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isArabic]);

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  }, [step, validateStep]);

  const handleSubmit = useCallback(() => {
    if (validateStep(3)) {
      createRequestMutation.mutate(formData);
    }
  }, [formData, validateStep, createRequestMutation]);

  const categoryOptions = Object.entries(TASK_CATEGORIES_WITH_SUBS).map(([key, cat]) => ({
    id: key,
    name: isArabic ? cat.nameAr : cat.nameEn,
    color: cat.colorHex,
    icon: cat.icon,
  }));

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">
          {isArabic ? 'اختر التصنيف' : 'Choose Category'}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto no-scrollbar py-2">
        {categoryOptions.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => updateField('category', cat.id)}
            data-testid={`button-category-${cat.id}`}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all",
              formData.category === cat.id
                ? "border-primary bg-primary/10"
                : "border-transparent bg-muted hover:bg-muted/80"
            )}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <span className="text-xl" style={{ color: cat.color }}>
                {cat.icon === 'sparkles' ? '✨' : 
                 cat.icon === 'graduation-cap' ? '🎓' : 
                 cat.icon === 'palette' ? '🎨' : 
                 cat.icon === 'hard-hat' ? '🔨' : 
                 cat.icon === 'star' ? '⭐' : '📦'}
              </span>
            </div>
            <span className="font-semibold text-sm block truncate">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
      
      {errors.category && (
        <p className="text-destructive text-sm font-medium">{errors.category}</p>
      )}
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">
          {isArabic ? 'تفاصيل الخدمة' : 'Service Details'}
        </h3>
      </div>
      
      <FloatingInput
        label={isArabic ? 'عنوان الخدمة' : 'Service Title'}
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        data-testid="input-service-title"
      />
      
      <div className="relative">
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={isArabic ? 'صف ما تحتاجه بالتفصيل...' : 'Describe what you need in detail...'}
          className={cn(
            "w-full h-32 px-4 py-4 rounded-2xl border-2 bg-card shadow-sm outline-none transition-all resize-none font-medium",
            errors.description 
              ? "border-destructive/50 focus:border-destructive" 
              : "border-transparent focus:border-primary/50"
          )}
          data-testid="input-service-description"
        />
        {errors.description && (
          <p className="text-destructive text-sm font-medium mt-1">{errors.description}</p>
        )}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">
          {isArabic ? 'الموعد والموقع' : 'Schedule & Location'}
        </h3>
      </div>
      
      <FloatingInput
        label={isArabic ? 'الميزانية (ريال)' : 'Budget (SAR)'}
        type="number"
        value={formData.budget}
        onChange={(e) => updateField('budget', e.target.value)}
        error={errors.budget}
        data-testid="input-budget"
      />
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowDatePicker(true)}
          data-testid="button-select-date"
          className={cn(
            "h-16 px-4 rounded-2xl border-2 bg-card flex items-center gap-3 transition-all text-left",
            formData.scheduledDate ? "border-primary/50" : "border-transparent",
            errors.scheduledDate && "border-destructive/50"
          )}
        >
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className={cn(
            "text-sm font-medium truncate",
            formData.scheduledDate ? "text-foreground" : "text-muted-foreground"
          )}>
            {formData.scheduledDate || (isArabic ? 'التاريخ' : 'Date')}
          </span>
        </button>
        
        <button
          onClick={() => setShowTimePicker(true)}
          data-testid="button-select-time"
          className={cn(
            "h-16 px-4 rounded-2xl border-2 bg-card flex items-center gap-3 transition-all text-left",
            formData.scheduledTime ? "border-primary/50" : "border-transparent",
            errors.scheduledTime && "border-destructive/50"
          )}
        >
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span className={cn(
            "text-sm font-medium truncate",
            formData.scheduledTime ? "text-foreground" : "text-muted-foreground"
          )}>
            {formData.scheduledTime || (isArabic ? 'الوقت' : 'Time')}
          </span>
        </button>
      </div>
      
      <div className="relative">
        <FloatingInput
          label={isArabic ? 'الموقع' : 'Location'}
          value={formData.location}
          onChange={(e) => updateField('location', e.target.value)}
          error={errors.location}
          data-testid="input-location"
        />
        <button
          onClick={getCurrentLocation}
          className="absolute right-3 top-4 p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
          data-testid="button-get-location"
        >
          {locationStatus === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : locationStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <MapPin className="w-5 h-5 text-primary" />
          )}
        </button>
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={resetAndClose}
        data-testid="modal-backdrop"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="glass-premium w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-safe shadow-2xl relative z-10"
        data-testid="modal-direct-request"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {isArabic ? 'طلب خدمة من' : 'Request Service from'}
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                {tasker.name}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </AnimatePresence>
        </div>
        
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 h-14 bg-muted text-foreground rounded-2xl font-bold text-lg hover:bg-muted/80 transition-all"
              data-testid="button-back"
            >
              {isArabic ? 'رجوع' : 'Back'}
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
              data-testid="button-next"
            >
              {isArabic ? 'التالي' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createRequestMutation.isPending}
              className="flex-1 h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="button-submit-request"
            >
              {createRequestMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {isArabic ? 'إرسال الطلب' : 'Send Request'}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
      
      <DateTimePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => updateField('scheduledDate', value)}
        mode="date"
        title={isArabic ? 'اختر التاريخ' : 'Select Date'}
      />
      
      <DateTimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={(value) => updateField('scheduledTime', value)}
        mode="time"
        title={isArabic ? 'اختر الوقت' : 'Select Time'}
      />
    </div>,
    document.body
  );
});
