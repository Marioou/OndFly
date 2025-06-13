// Versión del cache
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `daily-organizer-${CACHE_VERSION}`;

// Assets para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('daily-organizer-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Estrategia de cache: Network First, fallback to cache
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  // Excluir peticiones a Firebase y otras APIs
  if (event.request.url.includes('firestore.googleapis.com')) return;
  if (event.request.url.includes('firebase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar la respuesta para el cache
        const responseToCache = response.clone();

        // Actualizar el cache
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        return caches.match(event.request);
      })
  );
});

// Background Sync para tareas pendientes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = new URL('/', self.location.origin).href;

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((windowClients) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        return clients.openWindow(urlToOpen);
      })
    );
  }
});
