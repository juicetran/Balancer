/*
  THE BALANCER — Service Worker v4
  ─────────────────────────────────────────────────────────
  Cache-first strategy. Handles GitHub Pages subdirectory hosting.
  Place this file in the ROOT of your GitHub repo (same level as index.html).
*/

const CACHE_NAME = 'balancer-v4';
const SHELL_URLS = ['./', './index.html'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        fetch(event.request).then(fresh => {
          if (fresh && fresh.status === 200)
            caches.open(CACHE_NAME).then(c => c.put(event.request, fresh));
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
