// Service Worker for ERP Solution — Powered by DiGo
// Features Cache-Busting, Instant Updates, and Offline PWA Capabilities

const CACHE_NAME = 'erp-digo-v1.0.3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/digo-logo.png'
];

// Install Event - Pre-cache essential app shell
self.addEventListener('install', (event) => {
  console.log('[PWA Service Worker] Installing new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Cache Busting (Delete all old caches)
self.addEventListener('activate', (event) => {
  console.log('[PWA Service Worker] Activating & Purging Old Cache');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA Service Worker] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Cache-Busting Strategy with Scheme Validation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Ignore unsupported schemes like chrome-extension://
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Network-First for HTML & root requests (Cache Busting)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      }).catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for update message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
