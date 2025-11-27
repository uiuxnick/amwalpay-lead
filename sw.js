
const CACHE_NAME = 'amwal-survey-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache critical shell assets
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. API Calls (Supabase) -> Network Only (or Network First)
  // We don't cache Supabase calls in SW because the app handles offline queue manually in backend.ts
  if (event.request.url.includes('supabase')) {
    return; 
  }

  // 2. Navigation Requests (HTML) -> Network First, Fallback to Offline Shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // 3. Static Assets (Fonts, Scripts, Images) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Valid response check
          if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }

          // Clone and cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
                cache.put(event.request, responseToCache);
            } catch (e) {
                // Ignore errors for unsupported request types
            }
          });

          return networkResponse;
        })
        .catch(() => {
          // Network failed, nothing to do here, hope it's in cache
        });

      return cachedResponse || fetchPromise;
    })
  );
});