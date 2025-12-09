// Push Notifications Hook for PWA and Capacitor iOS
import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceType: string;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const { toast } = useToast();

  // Subscribe mutation to save subscription on server
  const subscribeMutation = useMutation({
    mutationFn: async (subscription: PushSubscriptionData) => {
      const response = await apiRequest('POST', '/api/push/subscribe', subscription);
      return response.json();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast({
        title: 'تم تفعيل الإشعارات',
        description: 'ستتلقى إشعارات فورية',
      });
    },
    onError: (error: Error) => {
      console.error('[Push] Subscribe error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تفعيل الإشعارات',
        variant: 'destructive',
      });
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/push/unsubscribe');
      return response.json();
    },
    onSuccess: () => {
      setIsSubscribed(false);
      toast({
        title: 'تم إلغاء الإشعارات',
        description: 'لن تتلقى إشعارات فورية بعد الآن',
      });
    },
  });

  // Initialize push notifications
  useEffect(() => {
    const init = async () => {
      if (Capacitor.isNativePlatform()) {
        // iOS/Android native - use Capacitor Push Notifications
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          setIsSupported(true);
          
          const permStatus = await PushNotifications.checkPermissions();
          setPermission(permStatus.receive === 'granted' ? 'granted' : 'default');
          
          // Listen for registration
          await PushNotifications.addListener('registration', (token) => {
            console.log('[Push] Native token:', token.value);
            // Native tokens are sent differently - just the token string
            subscribeMutation.mutate({
              endpoint: `native:${Capacitor.getPlatform()}:${token.value}`,
              p256dh: 'native',
              auth: 'native',
              deviceType: Capacitor.getPlatform(),
            });
          });
          
          // Listen for push notifications
          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[Push] Notification received:', notification);
          });
          
          // Listen for notification action
          await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('[Push] Action performed:', action);
            if (action.notification.data?.url) {
              window.location.href = action.notification.data.url;
            }
          });
        } catch (e) {
          console.error('[Push] Native init error:', e);
          setIsSupported(false);
        }
      } else if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        // Web PWA
        setIsSupported(true);
        setPermission(Notification.permission);
        
        // Check if already subscribed
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (e) {
          console.error('[Push] Failed to check subscription:', e);
        }
      }
    };
    
    init();
  }, []);

  // Register service worker for web push
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      // Check if service worker is already registered
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      
      if (!registration) {
        // Register the service worker
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[Push] Service worker registered');
      }
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('[Push] Service worker registration failed:', error);
      return null;
    }
  }, []);

  // Request permission and subscribe (Web)
  const subscribeWeb = useCallback(async () => {
    try {
      // First, register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Failed to register service worker');
      }
      
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result !== 'granted') {
        toast({
          title: 'تم رفض الإذن',
          description: 'يرجى السماح بالإشعارات من إعدادات المتصفح',
          variant: 'destructive',
        });
        return;
      }
      
      // Get VAPID public key from server
      const vapidResponse = await fetch('/api/push/vapid-key');
      if (!vapidResponse.ok) {
        throw new Error('Failed to fetch VAPID key');
      }
      const { publicKey } = await vapidResponse.json();
      
      if (!publicKey) {
        throw new Error('No VAPID public key returned');
      }
      
      // Wait for service worker to be fully ready
      const swRegistration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      
      const json = subscription.toJSON();
      
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Invalid subscription: missing required fields');
      }
      
      console.log('[Push] Web subscription created, keys present:', !!json.keys?.p256dh, !!json.keys?.auth);
      
      subscribeMutation.mutate({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        deviceType: 'web',
      });
    } catch (e: any) {
      console.error('[Push] Subscribe error:', e);
      toast({
        title: 'خطأ',
        description: e.message || 'فشل في تفعيل الإشعارات',
        variant: 'destructive',
      });
    }
  }, [registerServiceWorker, subscribeMutation, toast]);

  // Request permission and subscribe (Native)
  const subscribeNative = useCallback(async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        setPermission('granted');
      } else {
        toast({
          title: 'تم رفض الإذن',
          description: 'يرجى السماح بالإشعارات من الإعدادات',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      console.error('[Push] Native permission error:', e);
      toast({
        title: 'خطأ',
        description: 'فشل في تفعيل الإشعارات',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Subscribe based on platform
  const subscribe = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      await subscribeNative();
    } else {
      await subscribeWeb();
    }
  }, [subscribeNative, subscribeWeb]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      unsubscribeMutation.mutate();
    } catch (e) {
      console.error('[Push] Unsubscribe error:', e);
    }
  }, [unsubscribeMutation]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
