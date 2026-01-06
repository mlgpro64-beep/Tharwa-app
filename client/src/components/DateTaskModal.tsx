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
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { 
  X, Calendar, Clock, MapPin, FileText, 
  Send, Loader2, CheckCircle, Navigation
} from 'lucide-react';
import type { User as UserType } from '@shared/schema';

interface DateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasker: UserType;
  selectedDate: Date;
}

interface TaskFormData {
  title: string;
  description: string;
  scheduledTime: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
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

export const DateTaskModal = memo(function DateTaskModal({
  isOpen,
  onClose,
  tasker,
  selectedDate,
}: DateTaskModalProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const locale = isArabic ? ar : enUS;
  const { toast } = useToast();
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    scheduledTime: '',
    location: '',
    latitude: null,
    longitude: null,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return apiRequest('POST', '/api/direct-requests', {
        taskerId: tasker.id,
        title: data.title,
        description: data.description,
        scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
        scheduledTime: data.scheduledTime,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        budget: '0', // Default budget, can be updated later
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/direct-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
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
    setFormData({
      title: '',
      description: '',
      scheduledTime: '',
      location: '',
      latitude: null,
      longitude: null,
    });
    setErrors({});
    setLocationStatus('idle');
    onClose();
  }, [onClose]);

  const updateField = useCallback((field: keyof TaskFormData, value: string | number | null) => {
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

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = isArabic ? 'العنوان مطلوب' : 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = isArabic ? 'الوصف مطلوب' : 'Description is required';
    }
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = isArabic ? 'الوقت مطلوب' : 'Time is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = isArabic ? 'الموقع مطلوب' : 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isArabic]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      createRequestMutation.mutate(formData);
    }
  }, [formData, validateForm, createRequestMutation]);

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
        className="glass-premium w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-safe shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
        data-testid="modal-date-task"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {isArabic ? 'طلب خدمة' : 'Request Service'}
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale })}
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
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <label className="text-sm font-semibold text-foreground">
                {isArabic ? 'الوقت' : 'Time'}
              </label>
            </div>
            <button
              onClick={() => setShowTimePicker(true)}
              data-testid="button-select-time"
              className={cn(
                "w-full h-14 px-4 rounded-2xl border-2 bg-card flex items-center gap-3 transition-all text-left",
                formData.scheduledTime ? "border-primary/50" : "border-transparent",
                errors.scheduledTime && "border-destructive/50"
              )}
            >
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className={cn(
                "text-sm font-medium",
                formData.scheduledTime ? "text-foreground" : "text-muted-foreground"
              )}>
                {formData.scheduledTime || (isArabic ? 'اختر الوقت' : 'Select Time')}
              </span>
            </button>
            {errors.scheduledTime && (
              <p className="text-destructive text-sm font-medium mt-1">{errors.scheduledTime}</p>
            )}
          </div>

          <div>
            <FloatingInput
              label={isArabic ? 'عنوان الطلب' : 'Task Title'}
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              error={errors.title}
              data-testid="input-task-title"
              placeholder={isArabic ? 'مثال: تنظيف المنزل' : 'Example: House Cleaning'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-semibold text-foreground">
                {isArabic ? 'تفاصيل الطلب' : 'Task Details'}
              </label>
            </div>
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
              data-testid="input-task-description"
            />
            {errors.description && (
              <p className="text-destructive text-sm font-medium mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-semibold text-foreground">
                {isArabic ? 'الموقع' : 'Location'}
              </label>
            </div>
            <div className="relative">
              <FloatingInput
                label={isArabic ? 'الموقع' : 'Location'}
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                error={errors.location}
                data-testid="input-location"
                placeholder={isArabic ? 'أدخل العنوان أو استخدم الموقع الحالي' : 'Enter address or use current location'}
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
                  <Navigation className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>
            {errors.location && (
              <p className="text-destructive text-sm font-medium mt-1">{errors.location}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={resetAndClose}
            className="flex-1 h-14 bg-muted text-foreground rounded-2xl font-bold text-lg hover:bg-muted/80 transition-all"
            data-testid="button-cancel"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          
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
        </div>
      </motion.div>
      
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













