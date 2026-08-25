import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export interface PushSubscriptionData {
  id?: string;
  endpoint: string;
  keys?: any;
  user_phone?: string;
  created_at?: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  url?: string;
  promo_code?: string;
  created_at?: string;
}

/**
 * Checks if Notification API is supported by browser
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Gets current notification permission state
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Requests browser notification permission and saves subscription to Supabase
 */
export const subscribeToPushNotifications = async (userPhone?: string): Promise<boolean> => {
  if (!isNotificationSupported()) {
    toast.error('متصفحك لا يدعم الإشعارات المباشرة');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Save subscription identifier to Supabase
      const endpointId = 'sub_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      
      const payload: PushSubscriptionData = {
        endpoint: endpointId,
        user_phone: userPhone || localStorage.getItem('jamr_user_phone') || undefined
      };

      await supabase.from('push_subscriptions').upsert(payload, { onConflict: 'endpoint' }).select();
      localStorage.setItem('jamr_push_subscribed', 'true');
      toast.success('تم تفعيل إشعارات العروض بنجاح! 🔔');
      return true;
    } else if (permission === 'denied') {
      toast.error('تم رفض إذن الإشعارات من إعدادات المتصفح');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return false;
};

/**
 * Plays a pleasant notification sound when a broadcast is received
 */
export const playBroadcastSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Play a friendly two-tone notification melody (C5 -> G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(783.99, now + 0.12); // G5
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch (e) {
    console.warn('Audio playback skipped:', e);
  }
};

/**
 * Triggers a system push notification if permission is granted
 */
export const showSystemNotification = (title: string, message: string, url?: string) => {
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      playBroadcastSound();
      const notification = new Notification(title, {
        body: message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'jamr-broadcast-' + Date.now(),
        dir: 'rtl',
        lang: 'ar'
      });

      if (url) {
        notification.onclick = () => {
          window.focus();
          window.location.href = url;
        };
      }
    } catch (e) {
      console.error('Failed to trigger system notification:', e);
    }
  }
};
