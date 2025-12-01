import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { FloatingInput } from '@/components/FloatingInput';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function RegisterScreen() {
  const [, setLocation] = useLocation();
  const { userRole, setUser } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/auth/register', {
        ...data,
        role: userRole,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem('userId', data.user.id);
      toast({ title: 'Account created!', description: 'Welcome to TaskField' });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Min 3 characters';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Screen className="px-6">
      <div className="flex items-center justify-between py-4">
        <button 
          onClick={() => setLocation('/role')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-1.5">
          <div className="w-8 h-1.5 rounded-full bg-primary"></div>
          <div className="w-8 h-1.5 rounded-full bg-primary"></div>
          <div className="w-8 h-1.5 rounded-full bg-muted"></div>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col py-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Create your account
        </h1>
        <p className="text-muted-foreground mb-8">
          {userRole === 'tasker' 
            ? "Start earning by helping others" 
            : "Get things done with local help"}
        </p>

        <div className="space-y-4 flex-1">
          <FloatingInput
            label="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            autoComplete="name"
          />
          
          <FloatingInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          
          <FloatingInput
            label="Phone Number (Optional)"
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            autoComplete="tel"
          />
          
          <FloatingInput
            label="Username"
            value={formData.username}
            onChange={handleChange('username')}
            error={errors.username}
            autoComplete="username"
          />
          
          <FloatingInput
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="new-password"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={registerMutation.isPending}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none mt-6"
          data-testid="button-create-account"
        >
          {registerMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              Creating account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold">Sign in</Link>
        </p>
      </div>
    </Screen>
  );
}
