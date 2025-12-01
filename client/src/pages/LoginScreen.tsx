import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { FloatingInput } from '@/components/FloatingInput';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function LoginScreen() {
  const [, setLocation] = useLocation();
  const { setUser, switchRole } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      switchRole(data.user.role);
      localStorage.setItem('userId', data.user.id);
      toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      loginMutation.mutate(formData);
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
        <Link href="/">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
            data-testid="button-back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </Link>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col py-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 mx-auto">
          <span className="material-symbols-outlined text-4xl text-primary">login</span>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2 text-center">
          Welcome back
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          Sign in to continue
        </p>

        <div className="space-y-4 flex-1">
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
            autoComplete="current-password"
          />

          <div className="text-right">
            <button className="text-sm text-primary font-bold">
              Forgot password?
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loginMutation.isPending}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none mt-6"
          data-testid="button-sign-in"
        >
          {loginMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link href="/role" className="text-primary font-bold">Create one</Link>
        </p>
      </div>
    </Screen>
  );
}
