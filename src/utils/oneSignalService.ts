let ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '47c3b678-0a12-4010-aa6a-e8f78a363eef';
let ONESIGNAL_REST_KEY = import.meta.env.VITE_ONESIGNAL_REST_KEY || atob('b3NfdjJfYXBwX2k3YjNtNmFraWphYmJrdGs1ZDN5dW5yNjU2azd4bWNodG5hZWxkdnN5YWdvcTUzcWZzZDJmbjQyNWJyNmR5bTZqaXQ0Y29jMm91Y3JhNjVjbWdqZ3pyZW51ZTI1dWJhZWcyZG1rNWE=');

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

/**
 * Initialize OneSignal Web Push SDK
 */
export const initOneSignal = (appId?: string) => {
  const activeAppId = appId || ONESIGNAL_APP_ID;
  if (!activeAppId || typeof window === 'undefined') {
    console.log('OneSignal App ID not set yet.');
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId: activeAppId,
        allowLocalhostAsSecureOrigin: true,
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "هل ترغب في استقبال خصومات وعروض جمر التنور الحصرية؟",
                acceptButton: "موافق 👍",
                cancelButton: "لاحقاً"
              },
              delay: {
                pageViews: 1,
                timeDelay: 1
              }
            }
          ]
        },
        welcomeNotification: {
          title: "مطعم جمر التنور 🔥",
          message: "أهلاً بك! تم تفعيل إشعارات العروض والخصومات بنجاح 🎉"
        }
      });

      // Auto request permission if prompt available
      if (OneSignal.Notifications && OneSignal.Notifications.permission !== true) {
        setTimeout(() => {
          try {
            OneSignal.Notifications.requestPermission();
          } catch (e) {}
        }, 1500);
      }
      console.log('OneSignal initialized successfully');
    } catch (err) {
      console.warn('OneSignal init error:', err);
    }
  });
};

/**
 * Prompt user to subscribe to OneSignal Push Notifications
 */
export const requestOneSignalPermission = async () => {
  if (window.OneSignal) {
    try {
      await window.OneSignal.Notifications.requestPermission();
    } catch (e) {
      console.error('Error requesting OneSignal permission:', e);
    }
  }
};

/**
 * Send Background Push Notification to ALL subscribers via OneSignal REST API
 */
export const sendOneSignalPushNotification = async ({
  title,
  message,
  url,
  appId,
  restKey
}: {
  title: string;
  message: string;
  url?: string;
  appId?: string;
  restKey?: string;
}) => {
  const finalAppId = appId || ONESIGNAL_APP_ID;
  const finalRestKey = restKey || ONESIGNAL_REST_KEY;

  if (!finalAppId || !finalRestKey) {
    console.warn('OneSignal credentials missing, skipping REST API background push call.');
    return { success: false, reason: 'credentials_missing' };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${finalRestKey}`
      },
      body: JSON.stringify({
        app_id: finalAppId,
        included_segments: ['Subscribed Users'],
        headings: { ar: title, en: title, default: title },
        contents: { ar: message, en: message, default: message },
        url: url || window.location.origin,
        chrome_web_icon: "https://jamr-al-tanour-menu.vercel.app/assets/logo.png",
        chrome_web_badge: "https://jamr-al-tanour-menu.vercel.app/assets/logo.png",
        ios_sound: "default",
        android_sound: "default",
        sound: "default",
        priority: 10,
        ttl: 259200
      })
    });

    const result = await response.json();
    console.log('OneSignal push API response:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error triggering OneSignal push:', error);
    return { success: false, error };
  }
};
