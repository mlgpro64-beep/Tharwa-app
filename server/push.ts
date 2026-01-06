// Push Notification Service using web-push
import webpush from 'web-push';

// Generate VAPID keys once and store them as environment variables
// If not set, generate temporary ones for development
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouADVXc-hK3ltw1rMesmH_4dR1tG6rqc';

webpush.setVapidDetails(
  'mailto:support@tharwwa.com',
  vapidPublicKey,
  vapidPrivateKey
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    
    console.log('[Push] Notification sent successfully');
    return true;
  } catch (error: any) {
    console.error('[Push] Failed to send notification:', error.message);
    
    // If subscription is expired or invalid, return false
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[Push] Subscription expired or invalid');
      return false;
    }
    
    return false;
  }
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

// Notification types with Arabic translations
export const notificationTemplates = {
  newTask: {
    title: 'مهمة جديدة',
    titleEn: 'New Task',
  },
  bidReceived: {
    title: 'عرض جديد',
    titleEn: 'New Bid Received',
  },
  taskCompleted: {
    title: 'تم إنجاز المهمة',
    titleEn: 'Task Completed',
  },
  paymentReceived: {
    title: 'تم استلام الدفع',
    titleEn: 'Payment Received',
  },
  newMessage: {
    title: 'رسالة جديدة',
    titleEn: 'New Message',
  },
  directRequest: {
    title: 'طلب خدمة مباشر',
    titleEn: 'Direct Service Request',
  },
  levelUp: {
    title: 'ترقية المستوى',
    titleEn: 'Level Up!',
  },
};
