import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const CURRENT_CLIENT_VERSION = '20261122233001';

let isUpdating = false;

function performSafeReload() {
  if (isUpdating) return;
  isUpdating = true;

  // Check if customer is actively interacting with an input
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  const isTyping = activeTag === 'input' || activeTag === 'textarea';

  if (isTyping) {
    // Wait until user finishes or unfocuses
    const onBlur = () => {
      window.location.reload();
    };
    document.activeElement?.addEventListener('blur', onBlur, { once: true });
    // Or fallback after 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);
    return;
  }

  try {
    toast('جارٍ تحديث المنيو والأسعار تلقائياً... ✨', { icon: '🔄', duration: 2000 });
  } catch (e) {}

  setTimeout(() => {
    // Clear legacy service worker caches if any
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'jamr-images-v1') {
            caches.delete(key);
          }
        });
      }).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }, 600);
}

export async function checkRemoteVersion(): Promise<boolean> {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && data.version && data.version !== CURRENT_CLIENT_VERSION) {
      console.log(`[LiveUpdate] New version detected (${data.version} vs ${CURRENT_CLIENT_VERSION}). Triggering update...`);
      performSafeReload();
      return true;
    }
  } catch (e) {
    // Silently ignore network failures
  }
  return false;
}

export function initLiveUpdateService() {
  if (typeof window === 'undefined') return;

  // 1. Supabase Realtime broadcast listener (instant push to all connected devices)
  try {
    const channel = supabase.channel('app_live_sync');
    channel
      .on('broadcast', { event: 'force_reload' }, () => {
        console.log('[LiveUpdate] Instant broadcast reload received from server.');
        performSafeReload();
      })
      .subscribe();
  } catch (err) {
    console.warn('[LiveUpdate] Realtime subscription notice:', err);
  }

  // 2. Tab focus / Visibility change (when customer re-opens phone or switches back from WhatsApp)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkRemoteVersion();
    }
  });

  window.addEventListener('focus', () => {
    checkRemoteVersion();
  });

  // 3. Heartbeat background poll every 60 seconds
  setInterval(() => {
    checkRemoteVersion();
  }, 60 * 1000);

  // 4. Catch Vite dynamic import chunk mismatch when a new deploy goes live
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    console.warn('[LiveUpdate] Vite chunk version mismatch detected, reloading...');
    window.location.reload();
  });

  // Initial check after 3 seconds
  setTimeout(() => {
    checkRemoteVersion();
  }, 3000);
}

/**
 * Sends a real-time broadcast to ALL connected customers and cashier devices
 * instructing them to refresh immediately.
 */
export async function broadcastInstantUpdateToAll(): Promise<boolean> {
  try {
    const channel = supabase.channel('app_live_sync');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'force_reload',
      payload: {
        timestamp: Date.now(),
        triggeredAt: new Date().toISOString()
      }
    });
    return true;
  } catch (err) {
    console.error('Failed to broadcast instant update:', err);
    return false;
  }
}
