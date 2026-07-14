const CACHE_NAME = 'jagdamb-laundry-admin-cache-v2';
const urlsToCache = [
  '/admin/',
  '/admin/index.html',
  '/admin/dashboard.html',
  '/admin/admin.css',
  '/admin/admin.js',
  '/admin/manifest.json',
  '/assets/jagdamblogo.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(() => {});
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
