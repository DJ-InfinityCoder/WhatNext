self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('SW: Install Event Triggered');
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activate Event Triggered');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: data.icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.')
    event.notification.close()

    // 1. Get the URL from the notification data, or default to root
    const urlToOpen = event.notification.data?.url || '/console'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // 2. If a window is already open, focus it and redirect
                for (let client of windowClients) {
                    if (client.url.includes(new URL('/', self.location.origin).href) && 'focus' in client) {
                        return client.focus().then(c => c.navigate(urlToOpen));
                    }
                }
                // 3. Otherwise, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    )
})
