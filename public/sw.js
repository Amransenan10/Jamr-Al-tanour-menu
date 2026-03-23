// Basic Service Worker for PWA installation prompt
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('jamr-al-tanour-v1').then((cache) => cache.addAll([
            '/',
            '/index.html',
            '/assets/logo.png'
        ]))
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
