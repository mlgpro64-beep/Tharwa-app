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
  const { setUser } = useApp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = !!localStorage.getItem('userId');
  
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/me'],
    enabled: isAuthenticated,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
      if (currentUser.avatar) {
        setAvatarPreview(currentUser.avatar);
      }
    }
  }, [currentUser]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: t('errors.somethingWentWrong'), 
          description: 'Image size must be less than 5MB', 
          variant: 'destructive' 
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatarPreview(base64);
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
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({ title: t('profile.editProfile'), description: t('common.save') });
      setLocation('/profile');
    },
    onError: (error: Error) => {
      toast({ title: t('errors.somethingWentWrong'), description: error.message, variant: 'destructive' });
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
      const dataToSend = avatarPreview && avatarPreview !== currentUser?.avatar
        ? { ...formData, avatar: avatarPreview }
        : formData;
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
        <p className="text-sm text-muted-foreground mt-4">{t('profile.editProfile')}</p>
      </motion.div>

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
