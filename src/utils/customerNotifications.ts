// ─── Customer Notifications Utility (Cross-Platform iOS/Android/Desktop) ────

let customerAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// Initialize or get Web Audio Context
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!customerAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      customerAudioCtx = new AudioCtx();
    }
  }
  return customerAudioCtx;
};

// Auto-unlock AudioContext on first iOS / Android touch or click interaction
export const unlockCustomerAudio = () => {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch((e) => console.error('Failed to resume audio context', e));
      }
      // Play a silent 1ms buffer to force iOS Safari web audio unlock
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isAudioUnlocked = true;
    }
  } catch (e) {
    console.error('Customer audio unlock error', e);
  }
};

// Global click/touchstart/pointerdown listener setup to ensure audio is unlocked on iOS Safari
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockCustomerAudio();
    if (isAudioUnlocked) {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
    }
  };
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('pointerdown', unlock, { passive: true });
}

/**
 * Play pleasant chime tone for customer order updates
 * Works across Samsung Internet, iOS Safari, Android Chrome, and Desktop
 */
export const playCustomerStatusChime = (type: 'step' | 'ready' | 'new' = 'step') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const startTime = ctx.currentTime + 0.02; // Small offset for Android/Samsung AudioContext scheduling

    const playNote = (freq: number, start: number, duration: number, oscType: OscillatorType = 'sine', maxGain = 0.5) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(maxGain, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      } catch (e) {
        console.error('Error playing note:', e);
      }
    };

    if (type === 'new') {
      // Gentle 2-step ding
      playNote(659.25, startTime, 0.4); // E5
      playNote(880.00, startTime + 0.12, 0.6); // A5
    } else if (type === 'step') {
      // Pleasant double chime for step updates (accepted, preparing)
      playNote(523.25, startTime, 0.35); // C5
      playNote(659.25, startTime + 0.15, 0.5); // E5
    } else if (type === 'ready') {
      // Cheerful 3-note celebration melody (ready / completed)
      playNote(523.25, startTime, 0.25); // C5
      playNote(659.25, startTime + 0.12, 0.25); // E5
      playNote(783.99, startTime + 0.24, 0.35); // G5
      playNote(1046.50, startTime + 0.38, 0.7, 'triangle', 0.6); // C6
    }
  } catch (e) {
    console.error('Failed to play status chime:', e);
  }
};

/**
 * Trigger physical haptic vibration for Android & supported mobile devices
 */
export const triggerDeviceVibration = (pattern: number | number[] = [150, 100, 150]) => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.error('Vibration not supported or denied', e);
  }
};

/**
 * Send System Web Notification with cross-browser / iOS fallback
 */
export const sendSystemNotification = async (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const defaultOptions: Record<string, any> = {
    icon: '/assets/logo.png',
    badge: '/assets/logo.png',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    lang: 'ar',
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions as NotificationOptions);
        return;
      }
    }
    // Fallback if ServiceWorker notification is not available
    new window.Notification(title, defaultOptions as NotificationOptions);
  } catch (e) {
    try {
      new window.Notification(title, defaultOptions as NotificationOptions);
    } catch (err) {
      console.error('System notification error:', err);
    }
  }
};

/**
 * Unified status alert executor for customer order changes
 */
export const notifyCustomerStatusChange = (status: string, statusLabel: string, orderId?: string) => {
  const isReady = status === 'ready' || status === 'completed';
  const soundType = isReady ? 'ready' : 'step';
  const vibrationPattern = isReady ? [200, 100, 200, 100, 300] : [150, 100, 150];

  // 1. Play sound
  playCustomerStatusChime(soundType);

  // 2. Trigger vibration on supported devices (Android)
  triggerDeviceVibration(vibrationPattern);

  // 3. System Push Notification
  const notificationTitle = isReady ? '🎉 طلبك جاهز الآن!' : '🔔 تحديث جديد في طلبك';
  const notificationBody = `حالة طلبك الآن: ${statusLabel}`;

  sendSystemNotification(notificationTitle, {
    body: notificationBody,
    tag: `order-${orderId || 'update'}`,
  });
};

/**
 * Interactive test helper for users to test audio & vibration on Samsung/iOS mobile devices
 */
export const testCustomerNotificationAndSound = () => {
  unlockCustomerAudio();
  playCustomerStatusChime('ready');
  triggerDeviceVibration([200, 100, 200]);
};
