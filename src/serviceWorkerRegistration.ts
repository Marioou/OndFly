// Registers a service worker for PWA support
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('[SW] Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    });
  }
}

// Unregisters the service worker
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration
        .unregister()
        .then(() => console.log('[SW] Service Worker unregistered'))
        .catch(error => console.error('[SW] Service Worker unregister failed:', error));
    });
  }
}
