// sw.js - Service Worker del cliente


// Generador de las notificaciones
self.addEventListener('push', function (e) {
    const message = e.data.json();

    const options = {
        body: message.body,
        icon: message.icon,
        bagde: message.badge,
        actions: [{
                action: message.action_url,
                title: message.action_title,
                icon: message.action_icon
            },
        ]
    };

    e.waitUntil(self.registration.showNotification(message.title, options));
});


// Acción sobre las notificaciones
self.addEventListener('notificationclick', function (e) {
    console.log('Clic sobre la notificación recibido', e.notification.data);

    e.notification.close();
    e.waitUntil(clients.openWindow(e.notification.data));
});