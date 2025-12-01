import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { FloatingInput } from '@/components/FloatingInput';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

export default function EditProfileScreen() {
  const [, setLocation] = useLocation();
  const { setUser } = useApp();
  const { toast } = useToast();
  
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
      });
    }
  }, [currentUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('PATCH', '/api/users/me', data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({ title: 'Profile updated!', description: 'Your changes have been saved' });
      setLocation('/profile');
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      updateProfileMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Screen className="px-6">
      <div className="flex items-center gap-4 py-4 mb-4">
        <button 
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors active:scale-90"
          data-testid="button-back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-extrabold text-foreground">Edit Profile</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-border">
            <AvatarImage src={currentUser?.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {formData.name ? getInitials(formData.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <button 
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
            data-testid="button-change-avatar"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">Tap to change photo</p>
      </div>

      <div className="space-y-4 flex-1">
        <FloatingInput
          label="Full Name"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
        />
        
        <FloatingInput
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
        />
        
        <FloatingInput
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
        />
        
        <FloatingInput
          label="Location"
          value={formData.location}
          onChange={handleChange('location')}
        />
        
        <div className="relative">
          <textarea
            value={formData.bio}
            onChange={handleChange('bio')}
            placeholder="Tell others about yourself..."
            className="w-full h-32 p-4 rounded-2xl border-2 border-transparent bg-card shadow-sm outline-none transition-all placeholder:text-muted-foreground font-medium text-foreground resize-none focus:border-primary/50"
            data-testid="textarea-bio"
          />
          <label className="absolute left-4 top-3 text-[10px] font-bold text-primary uppercase tracking-wider">
            Bio
          </label>
        </div>
      </div>

      <div className="mt-8 pb-4">
        <button
          onClick={handleSubmit}
          disabled={updateProfileMutation.isPending}
          className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
          data-testid="button-save-profile"
        >
          {updateProfileMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </Screen>
  );
}
