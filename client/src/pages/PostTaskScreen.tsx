import { useState, useEffect, memo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FloatingInput } from '@/components/FloatingInput';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, AlertCircle, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import type { TaskWithDetails } from '@shared/schema';

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
}

const PostTaskScreen = memo(function PostTaskScreen() {
  const { step } = useParams<{ step: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  const currentStep = parseInt(step || '1');
  const isEditMode = window.location.pathname.includes('/edit');
  const taskId = isEditMode ? window.location.pathname.split('/')[2] : null;
  
  const categoryFromUrl = new URLSearchParams(window.location.search).get('category');

  const { data: existingTask } = useQuery<TaskWithDetails>({
    queryKey: ['/api/tasks', taskId],
    enabled: !!taskId && isEditMode,
  });

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    latitude: null,
    longitude: null,
    date: '',
    time: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string>('');

  useEffect(() => {
    if (existingTask && isEditMode) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description,
        category: existingTask.category,
        budget: String(existingTask.budget),
        location: existingTask.location,
        latitude: existingTask.latitude ? parseFloat(String(existingTask.latitude)) : null,
        longitude: existingTask.longitude ? parseFloat(String(existingTask.longitude)) : null,
        date: existingTask.date,
        time: existingTask.time,
      });
      if (existingTask.location) {
        setLocationStatus('success');
      }
    }
  }, [existingTask, isEditMode]);

  useEffect(() => {
    if (categoryFromUrl && !isEditMode && !formData.category) {
      setFormData(prev => ({ ...prev, category: categoryFromUrl }));
    }
  }, [categoryFromUrl, isEditMode, formData.category]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
        {
          headers: {
            'Accept-Language': i18n.language === 'ar' ? 'ar' : 'en',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      const address = data.address;
      
      const neighborhood = address.neighbourhood || address.suburb || address.district || address.quarter || '';
      const city = address.city || address.town || address.municipality || address.county || '';
      
      if (neighborhood && city) {
        return `${neighborhood}, ${city}`;
      } else if (city) {
        return city;
      } else if (neighborhood) {
        return neighborhood;
      } else if (address.state) {
        return address.state;
      }
      
      return data.display_name?.split(',').slice(0, 2).join(',').trim() || t('tasks.location');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return t('tasks.location');
    }
  }, [t, i18n]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('tasks.postTaskSteps.geolocationNotSupported'));
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const locationName = await reverseGeocode(latitude, longitude);
        
        setFormData(prev => ({
          ...prev,
          location: locationName,
          latitude,
          longitude,
        }));
        setLocationStatus('success');
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: '' }));
        }
      },
      (error) => {
        let errorMessage = t('tasks.postTaskSteps.unableToGetLocation');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('tasks.postTaskSteps.locationPermissionDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('tasks.postTaskSteps.locationUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('tasks.postTaskSteps.locationTimeout');
            break;
        }
        setLocationError(errorMessage);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [errors.location, reverseGeocode, t]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const endpoint = isEditMode ? `/api/tasks/${taskId}` : '/api/tasks';
      const method = isEditMode ? 'PATCH' : 'POST';
      return apiRequest(method, endpoint, {
        title: data.title,
        description: data.description,
        category: data.category,
        budget: parseFloat(data.budget),
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        date: data.date,
        time: data.time,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ 
        title: isEditMode ? t('tasks.taskUpdated') : t('tasks.taskPosted'), 
        description: isEditMode ? t('tasks.taskUpdated') : t('tasks.taskPosted')
      });
      setLocation('/my-tasks');
    },
    onError: (error: Error) => {
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
    },
  });

  const validateStep = useCallback((stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (stepNum === 1) {
      if (!formData.category) newErrors.category = t('errors.required');
    } else if (stepNum === 2) {
      if (!formData.title.trim()) newErrors.title = t('errors.required');
      if (!formData.description.trim()) newErrors.description = t('errors.required');
    } else if (stepNum === 3) {
      if (!formData.budget) newErrors.budget = t('errors.required');
      if (!formData.location.trim()) newErrors.location = t('errors.required');
      if (!formData.date) newErrors.date = t('errors.required');
      if (!formData.time) newErrors.time = t('errors.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        const queryParams = categoryFromUrl ? `?category=${categoryFromUrl}` : '';
        setLocation(`/post-task/${currentStep + 1}${queryParams}`);
      } else {
        createTaskMutation.mutate(formData);
      }
    }
  }, [validateStep, currentStep, setLocation, createTaskMutation, formData, categoryFromUrl]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      const queryParams = categoryFromUrl ? `?category=${categoryFromUrl}` : '';
      setLocation(`/post-task/${currentStep - 1}${queryParams}`);
    } else {
      setLocation('/home');
    }
  }, [currentStep, setLocation, categoryFromUrl]);

  const updateField = useCallback((field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-safe pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.3 }}
          className="absolute top-1/2 -right-20 w-80 h-80 bg-primary/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 flex flex-col min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between py-5"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="w-12 h-12 flex items-center justify-center rounded-2xl glass shadow-sm hover:shadow-md transition-all duration-300 hover:bg-primary/10"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex gap-2.5 items-center">
            {[1, 2, 3].map((s) => (
              <motion.div 
                key={s}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: s * 0.1, duration: 0.3 }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  s <= currentStep 
                    ? "bg-primary w-12 shadow-lg shadow-primary/30" 
                    : "bg-muted/50 w-8"
                )}
              />
            ))}
          </div>
          <div className="w-12"></div>
        </motion.div>

        <div className="flex-1 flex flex-col py-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {t('tasks.postTaskSteps.step1Title')}
                </h1>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {t('tasks.postTaskSteps.step1Description')}
                </p>
                <CategoryPicker
                  selected={formData.category}
                  onSelect={(cat) => updateField('category', cat)}
                />
                <AnimatePresence>
                  {errors.category && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-destructive text-sm font-bold mt-4 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {t('tasks.postTaskSteps.step2Title')}
                </h1>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {t('tasks.postTaskSteps.step2Description')}
                </p>
                <div className="space-y-6">
                  <FloatingInput
                    label={t('tasks.postTaskSteps.taskTitle')}
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    error={errors.title}
                    placeholder={t('tasks.postTaskSteps.taskTitlePlaceholder')}
                  />
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={t('tasks.postTaskSteps.taskDescriptionPlaceholder')}
                      className={cn(
                        "w-full h-44 p-5 rounded-2xl glass-input transition-all duration-300 placeholder:text-muted-foreground/60 font-medium text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-lg focus:shadow-primary/10",
                        errors.description && "ring-2 ring-destructive/50 border-destructive/50"
                      )}
                      data-testid="textarea-description"
                    />
                    <AnimatePresence>
                      {errors.description && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-destructive text-sm font-bold mt-2 flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {t('tasks.postTaskSteps.step3Title')}
                </h1>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {t('tasks.postTaskSteps.step3Description')}
                </p>
                <div className="space-y-6">
                  <FloatingInput
                    label={t('tasks.postTaskSteps.budget')}
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    error={errors.budget}
                    placeholder={t('tasks.postTaskSteps.budgetPlaceholder')}
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={getCurrentLocation}
                    disabled={locationStatus === 'loading'}
                    className={cn(
                      "w-full h-18 px-5 rounded-2xl glass text-left transition-all duration-300 flex items-center gap-4 shadow-sm hover:shadow-md",
                      locationStatus === 'success' && "ring-2 ring-green-500/40 shadow-green-500/10",
                      errors.location && "ring-2 ring-destructive/50 shadow-destructive/10",
                      locationStatus === 'loading' && "opacity-75"
                    )}
                    data-testid="button-get-location"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                      locationStatus === 'success' ? "bg-green-500/20 shadow-lg shadow-green-500/20" : "bg-primary/15"
                    )}>
                      {locationStatus === 'loading' ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : locationStatus === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <MapPin className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-0.5">
                        {t('tasks.postTaskSteps.location')}
                      </span>
                      <span className={cn(
                        "font-medium block truncate text-sm",
                        locationStatus === 'success' ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {locationStatus === 'loading' 
                          ? t('tasks.postTaskSteps.gettingLocation')
                          : locationStatus === 'success' 
                            ? formData.location 
                            : t('tasks.postTaskSteps.tapToUseLocation')}
                      </span>
                    </div>
                  </motion.button>
                  <AnimatePresence>
                    {(errors.location || locationError) && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-destructive text-sm font-bold flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {locationError || errors.location}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setShowDatePicker(true)}
                      className={cn(
                        "h-18 px-4 rounded-2xl glass text-left transition-all duration-300 shadow-sm hover:shadow-md",
                        formData.date && "ring-2 ring-primary/40 shadow-primary/10",
                        errors.date && "ring-2 ring-destructive/50 shadow-destructive/10"
                      )}
                      data-testid="button-select-date"
                    >
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-0.5">
                        {t('tasks.postTaskSteps.date')}
                      </span>
                      <span className={cn("font-medium text-sm", formData.date ? "text-foreground" : "text-muted-foreground")}>
                        {formData.date || t('tasks.postTaskSteps.selectDate')}
                      </span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setShowTimePicker(true)}
                      className={cn(
                        "h-18 px-4 rounded-2xl glass text-left transition-all duration-300 shadow-sm hover:shadow-md",
                        formData.time && "ring-2 ring-primary/40 shadow-primary/10",
                        errors.time && "ring-2 ring-destructive/50 shadow-destructive/10"
                      )}
                      data-testid="button-select-time"
                    >
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-0.5">
                        {t('tasks.postTaskSteps.time')}
                      </span>
                      <span className={cn("font-medium text-sm", formData.time ? "text-foreground" : "text-muted-foreground")}>
                        {formData.time || t('tasks.postTaskSteps.selectTime')}
                      </span>
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {(errors.date || errors.time) && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-destructive text-sm font-bold flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {t('tasks.postTaskSteps.selectDateAndTime')}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-auto pt-6"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={createTaskMutation.isPending}
              className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/40"
              data-testid="button-next"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEditMode ? t('tasks.postTaskSteps.saving') : t('tasks.postTaskSteps.posting')}
                </>
              ) : currentStep === 3 ? (
                isEditMode ? t('tasks.postTaskSteps.saveChanges') : t('tasks.postTaskSteps.postTask')
              ) : (
                t('tasks.postTaskSteps.continue')
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>

      <DateTimePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => updateField('date', value)}
        mode="date"
        title={t('tasks.postTaskSteps.selectDateTitle')}
      />

      <DateTimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={(value) => updateField('time', value)}
        mode="time"
        title={t('tasks.postTaskSteps.selectTimeTitle')}
      />
    </div>
  );
});

export default PostTaskScreen;
