const CACHE_NAME = 'tharwa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push notification event handlers
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/favicon.png',
      badge: payload.badge || '/favicon.png',
      data: payload.data || {},
      actions: payload.actions || [],
      tag: payload.tag || 'tharwa-notification',
      renotify: true,
      requireInteraction: payload.requireInteraction || false,
    };
    
    event.waitUntil(
      self.registration.showNotification(payload.title || 'ذروة', options)
    );
  } catch (e) {
    console.error('[SW] Push parse error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const url = data.url || data.actionUrl || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip ALL Vite dev server requests (HMR, module requests, etc.)
  if (url.pathname.startsWith('/src/') || 
      url.pathname.startsWith('/@') ||
      url.pathname.startsWith('/vite-hmr') ||
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.includes('?v=') ||
      url.pathname.includes('?t=') ||
      url.pathname.includes('vite-hmr') ||
      url.pathname.endsWith('.tsx') ||
      url.pathname.endsWith('.ts') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') || // Skip ALL JS files (including dynamic imports)
      url.pathname.endsWith('.mjs') ||
      url.pathname.includes('/assets/') || // Skip all assets in production build
      url.hostname === 'localhost' || 
      url.hostname === '127.0.0.1') {
    // Let browser/Vite handle these requests directly - don't intercept
    return;
  }
  
  // Skip API requests - let them go through normally
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For other requests (HTML, CSS, images), use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for static assets
        if (response.ok && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version only if fetch fails
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});
