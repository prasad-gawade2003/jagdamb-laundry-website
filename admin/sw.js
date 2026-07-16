const CACHE_NAME = 'jagdamb-laundry-admin-cache-v3';
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

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
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
