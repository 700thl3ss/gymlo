// Gymlo Service Worker for Web Notifications & Background Rest Timer
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let activeTimerId = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_REST_TIMER') {
    if (activeTimerId) {
      clearTimeout(activeTimerId);
      activeTimerId = null;
    }
    const delay = event.data.delayMs || 60000;
    activeTimerId = setTimeout(() => {
      self.registration.showNotification(event.data.title || "Rest Timer Done! 🔔", {
        body: event.data.body || "Time for your next set. Let's get it!",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "gymlo-rest-timer",
        renotify: true,
        vibrate: [250, 100, 250, 100, 300],
      });
      activeTimerId = null;
    }, delay);
  } else if (event.data && event.data.type === 'CANCEL_REST_TIMER') {
    if (activeTimerId) {
      clearTimeout(activeTimerId);
      activeTimerId = null;
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
