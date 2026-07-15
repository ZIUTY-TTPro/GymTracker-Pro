const CACHE_NAME = 'gymtracker-v1.1.4';
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

// ==========================
// INSTALL
// ==========================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Wymusza natychmiastową aktywację nowego SW
});

// ==========================
// ACTIVATE
// ==========================
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
    }).then(() => self.clients.claim()) // Nowy SW przejmuje kontrolę natychmiast
  );
});

// ==========================
// OFFLINE SUPPORT (Improved - always try network first for navigation)
// ==========================
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Zapisuj do cache tylko żądania HTTP/HTTPS (pomija np. chrome-extension://)
          const copy = response.clone();
          if (event.request.url.startsWith('http')) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        })
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

// ==========================
// BACKGROUND SYNC
// ==========================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }
});

async function syncWorkouts() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}

// ==========================
// PERIODIC SYNC
// ==========================
self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(periodicSync());
  }
});

async function periodicSync() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(urlsToCache);
}

// ==========================
// MESSAGE HANDLER (for update notification)
// ==========================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
