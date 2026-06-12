const CACHE_NAME = 'gymtracker-v1.0.0'; // ZMIEŃ wersję przy każdej aktualizacji!
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './translations.js',
  './timer.js',
  './charts.js',
  './ui.js',
  './chart.umd.min.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const offlineFallbackPage = './index.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;
          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).catch(() => {
          return caches.match(offlineFallbackPage);
        });
      })
    );
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', event => {
  event.waitUntil(Promise.resolve());
});
