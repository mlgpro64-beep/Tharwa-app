// Biometric Authentication Hook for iOS Face ID / Touch ID
import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Note: For full biometric support, @capacitor-community/biometric-auth plugin is needed
// This implementation provides a fallback for web and basic structure for native

interface BiometricResult {
  success: boolean;
  error?: string;
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const { user } = useApp();
  const { toast } = useToast();

  // Update biometric preference on server
  const updateBiometricMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('PATCH', '/api/users/me', {
        biometricEnabled: enabled,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsEnabled(data.biometricEnabled);
    },
  });

  // Check if biometric auth is available
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
      // On iOS, biometrics are available
      // Full implementation would use @capacitor-community/biometric-auth
      setIsSupported(true);
      return true;
    } else if (window.PublicKeyCredential) {
      // Web Authentication API for passkeys/biometrics
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsSupported(available);
        return available;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Authenticate with biometrics
  const authenticate = useCallback(async (): Promise<BiometricResult> => {
    if (Capacitor.isNativePlatform()) {
      // Native iOS/Android biometric auth
      // Full implementation would use:
      // import { BiometricAuth } from '@capacitor-community/biometric-auth';
      // const result = await BiometricAuth.authenticate({
      //   reason: 'تسجيل الدخول إلى ذروة',
      //   title: 'التحقق من الهوية',
      // });
      
      toast({
        title: 'Face ID / Touch ID',
        description: 'سيتم تفعيل هذه الميزة قريباً',
      });
      
      return { success: false, error: 'Native biometrics require additional plugin' };
    } else if (window.PublicKeyCredential) {
      // Web Authentication API
      try {
        // This is a simplified version - full implementation needs proper WebAuthn setup
        toast({
          title: 'البصمة / Face ID',
          description: 'متاحة على التطبيق الأصلي فقط',
        });
        return { success: false, error: 'Web biometrics not fully implemented' };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: false, error: 'Biometrics not supported' };
  }, [toast]);

  // Enable biometric auth
  const enable = useCallback(async (): Promise<boolean> => {
    const result = await authenticate();
    if (result.success) {
      updateBiometricMutation.mutate(true);
      toast({
        title: 'تم تفعيل البصمة',
        description: 'يمكنك الآن تسجيل الدخول بالبصمة',
      });
      return true;
    }
    return false;
  }, [authenticate, updateBiometricMutation, toast]);

  // Disable biometric auth
  const disable = useCallback(async (): Promise<void> => {
    updateBiometricMutation.mutate(false);
    toast({
      title: 'تم إلغاء البصمة',
      description: 'لن يتم استخدام البصمة لتسجيل الدخول',
    });
  }, [updateBiometricMutation, toast]);

  return {
    isSupported,
    isEnabled: user?.biometricEnabled || isEnabled,
    checkAvailability,
    authenticate,
    enable,
    disable,
    isLoading: updateBiometricMutation.isPending,
  };
}
