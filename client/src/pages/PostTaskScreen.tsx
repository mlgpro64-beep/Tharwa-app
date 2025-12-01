import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { Screen } from '@/components/layout/Screen';
import { FloatingInput } from '@/components/FloatingInput';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { TaskWithDetails } from '@shared/schema';

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  date: string;
  time: string;
}

export default function PostTaskScreen() {
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
    date: '',
    time: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingTask && isEditMode) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description,
        category: existingTask.category,
        budget: String(existingTask.budget),
        location: existingTask.location,
        date: existingTask.date,
        time: existingTask.time,
      });
    }
  }, [existingTask, isEditMode]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const endpoint = isEditMode ? `/api/tasks/${taskId}` : '/api/tasks';
      const method = isEditMode ? 'PATCH' : 'POST';
      return apiRequest(method, endpoint, {
        ...data,
        budget: parseFloat(data.budget),
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

  const validateStep = (stepNum: number): boolean => {
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
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setLocation(`/post-task/${currentStep + 1}`);
      } else {
        createTaskMutation.mutate(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setLocation(`/post-task/${currentStep - 1}`);
    } else {
      window.history.back();
    }
  };

  const updateField = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Screen className="px-6">
      <div className="flex items-center justify-between py-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-8 h-1.5 rounded-full transition-colors",
                s <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col py-8">
        {currentStep === 1 && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              What do you need help with?
            </h1>
            <p className="text-muted-foreground mb-8">
              Select a category for your task
            </p>
            <CategoryPicker
              selected={formData.category}
              onSelect={(cat) => updateField('category', cat)}
            />
            {errors.category && (
              <p className="text-destructive text-sm font-bold mt-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.category}
              </p>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Describe your task
            </h1>
            <p className="text-muted-foreground mb-8">
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
                    "w-full h-40 p-4 rounded-2xl border-2 bg-card shadow-sm outline-none transition-all placeholder:text-muted-foreground font-medium text-foreground resize-none",
                    errors.description 
                      ? "border-destructive/50 focus:border-destructive" 
                      : "border-transparent focus:border-primary/50"
                  )}
                  data-testid="textarea-description"
                />
                {errors.description && (
                  <p className="text-destructive text-sm font-bold mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Task details
            </h1>
            <p className="text-muted-foreground mb-8">
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
              <FloatingInput
                label="Location"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                error={errors.location}
                placeholder="Enter address or area"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDatePicker(true)}
                  className={cn(
                    "h-16 px-4 rounded-2xl border-2 bg-card text-left transition-all",
                    formData.date ? "border-primary/50" : "border-transparent",
                    errors.date && "border-destructive/50"
                  )}
                  data-testid="button-select-date"
                >
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Date</span>
                  <span className={cn("font-medium", formData.date ? "text-foreground" : "text-muted-foreground")}>
                    {formData.date || "Select date"}
                  </span>
                </button>
                <button
                  onClick={() => setShowTimePicker(true)}
                  className={cn(
                    "h-16 px-4 rounded-2xl border-2 bg-card text-left transition-all",
                    formData.time ? "border-primary/50" : "border-transparent",
                    errors.time && "border-destructive/50"
                  )}
                  data-testid="button-select-time"
                >
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Time</span>
                  <span className={cn("font-medium", formData.time ? "text-foreground" : "text-muted-foreground")}>
                    {formData.time || "Select time"}
                  </span>
                </button>
              </div>
              {(errors.date || errors.time) && (
                <p className="text-destructive text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Please select date and time
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-auto pt-6">
          <button
            onClick={handleNext}
            disabled={createTaskMutation.isPending}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
            data-testid="button-next"
          >
            {createTaskMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                {isEditMode ? 'Saving...' : 'Posting...'}
              </div>
            ) : currentStep === 3 ? (
              isEditMode ? 'Save Changes' : 'Post Task'
            ) : (
              'Continue'
            )}
          </button>
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
    </Screen>
  );
}
