/**
 * Service Worker pour gérer les notifications Web Push
 */

const CACHE_NAME = 'ecole-primaire-v1';
const urlsToCache = [
  '/',
  '/login',
  '/manifest.json',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installé');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📥 Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️  Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestion des événements push
self.addEventListener('push', (event) => {
  console.log('🔔 Notification push reçue');

  let notificationData = {
    title: 'Nouvelle notification',
    body: 'Vous avez une nouvelle notification',
    icon: '/logo_ecole_primaire_le_mont_sinai_app.png',
    badge: '/logo_ecole_primaire_le_mont_sinai_app.png',
    data: {},
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
      };
    }
  } catch (error) {
    console.error('Erreur lors du parsing de la notification:', error);
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    vibrate: [200, 100, 200], // Vibration pattern
    tag: 'ecole-primaire-notification',
    requireInteraction: true, // Notification reste visible jusqu'à interaction
    silent: false, // Son activé
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestion du clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️  Notification cliquée');

  event.notification.close();

  // Ouvrir l'application
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Interception des requêtes réseau pour le cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone la requête car elle ne peut être utilisée qu'une fois
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Vérifie si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone la réponse car elle ne peut être utilisée qu'une fois
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

console.log('🚀 Service Worker chargé');
