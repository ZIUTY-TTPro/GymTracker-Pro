const CACHE_NAME = 'gymtracker-v1.0.3';
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
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request);
    }).catch(() => caches.match('./index.html'))
  );
});
