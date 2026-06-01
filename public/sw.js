// MiFinanzas Service Worker - Force no-cache for GitHub Pages
// This prevents the browser from serving stale JS/CSS chunks

const CACHE_NAME = 'mf-no-cache-v1';

// Install: delete ALL existing caches
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    )
  );
  self.skipWaiting();
});

// Activate: claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: always go to network, never use cache
self.addEventListener('fetch', (event) => {
  // For navigation requests (HTML pages), use network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For all other requests (JS, CSS, images, etc.), ALWAYS fetch from network
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      return caches.match(event.request);
    })
  );
});
