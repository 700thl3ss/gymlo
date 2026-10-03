// Gymlo Service Worker for Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle real Web Push notifications from Apple APNs / server
self.addEventListener('push', (event) => {
  let data = {
    title: "Rest Timer Done! 🔔",
    body: "Time for your next set. Let's get it!",
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "Time for your next set. Let's get it!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "gymlo-rest-timer", // Deduplicates so at most 1 notification is ever visible
    renotify: false,
    vibrate: [250, 100, 250, 100, 300],
    data: { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title || "Rest Timer Done! 🔔", options));
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
