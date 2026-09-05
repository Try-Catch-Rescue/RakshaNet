/* ==========================================================================
   service-worker.js — Offline-first app shell caching.
   On first visit (with internet) every core file is cached. After that,
   RakshaNet works with ZERO connectivity — critical for flood-hit areas
   where mobile networks are usually the first thing to go down.
   ========================================================================== */

const CACHE_NAME = 'rakshanet-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/styles.css',
  './js/i18n.js',
  './js/data.js',
  './js/scoring.js',
  './js/state.js',
  './js/voice.js',
  './js/offline.js',
  './js/accessibility.js',
  './js/citizen.js',
  './js/admin.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first: serve instantly from cache, refresh cache in the background
// when a network is available. Guarantees offline operation of the app shell.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached); // offline — fall back to cache
      return cached || networkFetch;
    })
  );
});
