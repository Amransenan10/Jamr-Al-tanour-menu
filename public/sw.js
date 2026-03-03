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

self.addEventListener('fetch', (e) => {
    // Basic network-first strategy, falling back to cache
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
