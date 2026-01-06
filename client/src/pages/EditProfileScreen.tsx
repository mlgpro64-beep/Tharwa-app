import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Screen } from '@/components/layout/Screen';
import { FloatingInput } from '@/components/FloatingInput';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Camera, ArrowLeft, Loader2 } from 'lucide-react';
import type { User } from '@shared/schema';

export default function EditProfileScreen() {
  const [, setLocation] = useLocation();
  const { setUser, user: appUser } = useApp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          setTimeout(() => setLocation('/login'), 1000);
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch user');
      }
      const userData = await res.json();
      return userData;
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userData = currentUser || appUser;
    if (userData) {
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        location: userData.location || '',
      });
      setAvatarPreview(userData.avatar || null);
    }
  }, [currentUser, appUser]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ 
          title: t('errors.somethingWentWrong'), 
          description: t('profile.invalidImageType') || 'Please select an image file', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: t('errors.somethingWentWrong'), 
          description: t('profile.imageTooLarge') || 'Image size must be less than 5MB', 
          variant: 'destructive' 
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAvatarPreview(base64);
          toast({ 
            title: t('profile.imageSelected') || 'Image selected', 
            description: t('profile.clickSaveToUpdate') || 'Click Save to update your profile picture',
          });
        }
      };
      reader.onerror = () => {
        toast({ 
          title: t('errors.somethingWentWrong'), 
          description: t('profile.imageLoadError') || 'Failed to load image', 
          variant: 'destructive' 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData & { avatar?: string }) => {
      const response = await apiRequest('PATCH', '/api/users/me', data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      // Update avatar preview with the saved avatar
      if (data.avatar) {
        setAvatarPreview(data.avatar);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', data.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ 
        title: t('profile.editProfile'), 
        description: t('profile.profileUpdated') || t('common.save') 
      });
      setLocation('/profile');
    },
    onError: (error: Error) => {
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.username.trim()) {
      newErrors.username = t('errors.required');
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username.trim())) {
      newErrors.username = t('auth.invalidUsername');
    }
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const dataToSend: typeof formData & { avatar?: string } = { ...formData };
      
      // Always include avatar if preview exists (user selected a new image)
      if (avatarPreview) {
        dataToSend.avatar = avatarPreview;
        console.log('[Profile] Updating avatar, preview length:', avatarPreview.length);
      }
      
      console.log('[Profile] Submitting profile update:', { 
        hasAvatar: !!dataToSend.avatar,
        avatarLength: dataToSend.avatar?.length 
      });
      
      updateProfileMutation.mutate(dataToSend);
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

  // Show loading state
  if (isLoadingUser) {
    return (
      <Screen className="px-6">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Screen>
    );
  }

  // If no user data, show error or redirect
  const userData = currentUser || appUser;
  if (!userData) {
    return (
      <Screen className="px-6">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-muted-foreground mb-4">{t('errors.unauthorized') || 'Please login to edit your profile'}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation('/login')}
            className="px-6 py-3 gradient-primary text-white rounded-2xl font-bold"
          >
            {t('auth.login')}
          </motion.button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className="px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 py-4 mb-4"
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.history.back()}
          className="w-11 h-11 flex items-center justify-center rounded-2xl glass"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground/80 rtl:rotate-180" />
        </motion.button>
        <h1 className="text-2xl font-extrabold text-foreground">{t('profile.editProfile')}</h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-avatar-file"
          />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAvatarClick}
            className="cursor-pointer"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 to-accent/40 rounded-full blur-md" />
            <Avatar className="relative w-28 h-28 border-4 border-white/50 dark:border-white/20 shadow-2xl">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                {formData.name ? getInitials(formData.name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAvatarClick}
            className="absolute -bottom-1 -right-1 w-10 h-10 gradient-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white/50 rtl:-left-1 rtl:right-auto"
            data-testid="button-change-avatar"
          >
            <Camera className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {t('profile.changeAvatar') || 'Tap to change profile picture'}
        </p>
      </motion.div>

      <div className="space-y-4 flex-1">
        <FloatingInput
          label="Full Name"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
        />
        
        <FloatingInput
          label={t('auth.username') || 'Username'}
          value={formData.username}
          onChange={handleChange('username')}
          error={errors.username}
          dir="ltr"
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 pb-4"
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={updateProfileMutation.isPending}
          className="w-full h-14 gradient-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all"
          data-testid="button-save-profile"
        >
          {updateProfileMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.loading')}
            </div>
          ) : (
            t('common.save')
          )}
        </motion.button>
      </motion.div>
    </Screen>
  );
}
