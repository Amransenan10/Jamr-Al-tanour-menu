import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNotificationPermission, subscribeToPushNotifications } from '../utils/pushSubscription';
import { requestOneSignalPermission } from '../utils/oneSignalService';

export const PushSubscriptionBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user already acted or subscribed
    const isSubscribed = localStorage.getItem('jamr_push_subscribed') === 'true';
    const isDismissed = localStorage.getItem('jamr_push_dismissed') === 'true';

    if (isSubscribed) {
      setSubscribed(true);
      return;
    }

    if (!isDismissed && getNotificationPermission() !== 'denied') {
      // Show banner after a slight delay for smooth experience
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Request OneSignal permission asynchronously without blocking
      requestOneSignalPermission().catch(e => console.warn(e));

      // Subscribe to push notifications with a 2-second anti-hang fallback
      const subPromise = subscribeToPushNotifications();
      const timeoutPromise = new Promise<boolean>(resolve => setTimeout(() => resolve(true), 2000));

      await Promise.race([subPromise, timeoutPromise]);

      localStorage.setItem('jamr_push_subscribed', 'true');
      setSubscribed(true);
      setShow(false);
    } catch (err) {
      console.warn('Subscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('jamr_push_dismissed', 'true');
    setShow(false);
  };

  if (!show || subscribed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-zinc-900/95 dark:bg-black/95 text-white p-4 rounded-3xl border border-amber-500/30 shadow-2xl backdrop-blur-md"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 left-3 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5 pl-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
            <BellRing size={24} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Sparkles size={14} />
              <span>عروض حصرية وخصومات!</span>
            </div>
            <h4 className="font-black text-sm text-white">هل ترغب في تفعيل الإشعارات؟</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              اشترك الآن لتصلك خصومات اليوم والوجبات المجانية فور إطلاقها!
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Bell size={14} />
            <span>{loading ? 'جاري التفعيل...' : 'تفعيل الإشعارات 🔔'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-xs rounded-xl transition-colors"
          >
            لاحقاً
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
