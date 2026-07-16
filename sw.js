const CACHE_NAME = 'jagdamb-laundry-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/assets/jagdamblogo.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png',
  '/assets/bg-laundry.webp',
  '/assets/clothes-pile.webp',
  '/assets/basket.webp',
  '/assets/offer.webp'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(() => {});
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Clearing Old Cache', cache);
              return caches.delete(cache);
            }
          })
        );
      })
    ])
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

// ── Web Push Notifications ───────────────────────────────────────────────────

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Order Update', body: event.data.text() };
    }
  }

  const title = data.title || 'Order Update';
  const options = {
    body: data.body || 'Your order status has changed.',
    icon: '/assets/pwa-icon-192.png',
    badge: '/assets/pwa-icon-192.png',
    data: {
      url: data.orderId ? `/?action=rate&order_id=${data.orderId}` : '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const targetUrl = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window open with this exact URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If any app window is open, navigate it to target URL and focus
      if (windowClients.length > 0) {
        const firstClient = windowClients[0];
        if ('navigate' in firstClient) {
          firstClient.navigate(targetUrl);
        }
        if ('focus' in firstClient) {
          return firstClient.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
