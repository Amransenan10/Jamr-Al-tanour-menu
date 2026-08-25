// Basic Service Worker for PWA installation & Push Notifications
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open('jamr-al-tanour-v1').then((cache) => cache.addAll([
            '/',
            '/index.html'
        ]))
    );
});

self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

// Handle incoming background Push Notifications
self.addEventListener('push', (event) => {
    let data = { title: 'إشعار جديد من جمر التنور 🔥', body: 'تفقّد أحدث العروض والخصومات!' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || data.message || '',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        dir: 'rtl',
        lang: 'ar'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Cache-first for images, Network-first for everything else
    const isImage = event.request.destination === 'image';

    if (isImage) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    return caches.open('jamr-images-v1').then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    }
});
