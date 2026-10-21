// MySecondBrain Service Worker - Offline Caching Engine
const CACHE_NAME = 'secondbrain-cache-v2';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const relativeAssets = [
    scope,
    new URL('index.html', scope).toString(),
    new URL('manifest.webmanifest', scope).toString(),
    new URL('icon.svg', scope).toString(),
    new URL('pwa-192x192.png', scope).toString(),
    new URL('pwa-512x512.png', scope).toString(),
    new URL('apple-touch-icon.png', scope).toString(),
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(relativeAssets).catch((err) => {
        console.warn('[SW] Core precache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (event.request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle CDN assets (HuggingFace, MLC, PDF.js, Wikipedia)
  if (
    url.hostname.includes('esm.run') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('huggingface.co')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          return cachedResponse || new Response('Offline resource unavailable', { status: 503 });
        }
      })
    );
    return;
  }

  // App shell & static assets: Stale-While-Revalidate or Network-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
