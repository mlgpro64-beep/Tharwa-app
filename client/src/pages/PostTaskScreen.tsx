import { useState, useEffect, memo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const currentStep = parseInt(step || '1');
  const isEditMode = window.location.pathname.includes('/edit');
  const taskId = isEditMode ? window.location.pathname.split('/')[2] : null;

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

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setFormData(prev => ({
          ...prev,
          location: locationString,
          latitude,
          longitude,
        }));
        setLocationStatus('success');
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: '' }));
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable it in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
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
  }, [errors.location]);

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
        title: isEditMode ? 'Task updated!' : 'Task posted!', 
        description: isEditMode ? 'Your changes have been saved' : 'Your task is now live' 
      });
      setLocation('/my-tasks');
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save task', description: error.message, variant: 'destructive' });
    },
  });

  const validateStep = useCallback((stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (stepNum === 1) {
      if (!formData.category) newErrors.category = 'Please select a category';
    } else if (stepNum === 2) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
    } else if (stepNum === 3) {
      if (!formData.budget) newErrors.budget = 'Budget is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.date) newErrors.date = 'Date is required';
      if (!formData.time) newErrors.time = 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setLocation(`/post-task/${currentStep + 1}`);
      } else {
        createTaskMutation.mutate(formData);
      }
    }
  }, [validateStep, currentStep, setLocation, createTaskMutation, formData]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setLocation(`/post-task/${currentStep - 1}`);
    } else {
      window.history.back();
    }
  }, [currentStep, setLocation]);

  const updateField = useCallback((field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pt-safe pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute -top-20 -left-20 w-80 h-80 bg-primary/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 px-6 flex flex-col min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-4"
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
            {[1, 2, 3].map((s) => (
              <motion.div 
                key={s}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: s * 0.1 }}
                className={cn(
                  "w-10 h-1.5 rounded-full transition-colors",
                  s <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="w-11"></div>
        </motion.div>

        <div className="flex-1 flex flex-col py-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                  What do you need help with?
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Select a category for your task
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
                className="flex-1 flex flex-col"
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                  Describe your task
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Be specific so taskers understand what you need
                </p>
                <div className="space-y-4">
                  <FloatingInput
                    label="Task Title"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    error={errors.title}
                    placeholder="e.g., Help me move furniture"
                  />
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe your task in detail..."
                      className={cn(
                        "w-full h-40 p-5 rounded-2xl glass-input transition-all placeholder:text-muted-foreground font-medium text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30",
                        errors.description && "border-destructive"
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
                className="flex-1 flex flex-col"
              >
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                  Task details
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Set your budget, location, and schedule
                </p>
                <div className="space-y-4">
                  <FloatingInput
                    label="Budget ($)"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    error={errors.budget}
                    placeholder="0"
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={getCurrentLocation}
                    disabled={locationStatus === 'loading'}
                    className={cn(
                      "w-full h-16 px-5 rounded-2xl glass text-left transition-all flex items-center gap-4",
                      locationStatus === 'success' && "ring-2 ring-green-500/30",
                      errors.location && "ring-2 ring-destructive/50"
                    )}
                    data-testid="button-get-location"
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                      locationStatus === 'success' ? "bg-green-500/15" : "bg-primary/15"
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
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Location</span>
                      <span className={cn(
                        "font-medium block truncate",
                        locationStatus === 'success' ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {locationStatus === 'loading' 
                          ? 'Getting location...' 
                          : locationStatus === 'success' 
                            ? formData.location 
                            : 'Tap to use current location'}
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
                      onClick={() => setShowDatePicker(true)}
                      className={cn(
                        "h-16 px-4 rounded-2xl glass text-left transition-all",
                        formData.date && "ring-2 ring-primary/30",
                        errors.date && "ring-2 ring-destructive/50"
                      )}
                      data-testid="button-select-date"
                    >
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Date</span>
                      <span className={cn("font-medium", formData.date ? "text-foreground" : "text-muted-foreground")}>
                        {formData.date || "Select date"}
                      </span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowTimePicker(true)}
                      className={cn(
                        "h-16 px-4 rounded-2xl glass text-left transition-all",
                        formData.time && "ring-2 ring-primary/30",
                        errors.time && "ring-2 ring-destructive/50"
                      )}
                      data-testid="button-select-time"
                    >
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Time</span>
                      <span className={cn("font-medium", formData.time ? "text-foreground" : "text-muted-foreground")}>
                        {formData.time || "Select time"}
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
                        Please select date and time
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={createTaskMutation.isPending}
              className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              data-testid="button-next"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEditMode ? 'Saving...' : 'Posting...'}
                </>
              ) : currentStep === 3 ? (
                isEditMode ? 'Save Changes' : 'Post Task'
              ) : (
                'Continue'
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
        title="Select Date"
      />

      <DateTimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={(value) => updateField('time', value)}
        mode="time"
        title="Select Time"
      />
    </div>
  );
});

export default PostTaskScreen;
