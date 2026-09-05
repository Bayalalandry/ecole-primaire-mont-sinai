/**
 * Service pour gérer les abonnements Web Push côté frontend
 */

import { API_URL } from '../config/apiConfig';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export const pushService = {
  /**
   * Obtenir la clé publique VAPID depuis le backend
   */
  async getVapidPublicKey(): Promise<string> {
    const response = await fetch(`${API_URL}/push/vapid-public-key`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la clé VAPID');
    }
    const data = await response.json();
    return data.publicKey;
  },

  /**
   * Enregistrer un abonnement push auprès du backend
   */
  async subscribe(subscription: PushSubscriptionData, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement de l\'abonnement');
    }
  },

  /**
   * Désenregistrer un abonnement push
   */
  async unsubscribe(endpoint: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du désabonnement');
    }
  },

  /**
   * Récupérer les abonnements push de l'utilisateur
   */
  async getSubscriptions(token: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/push/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des abonnements');
    }

    const data = await response.json();
    return data.subscriptions || [];
  },
};

/**
 * Enregistrer le service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️  Service Worker non supporté par ce navigateur');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('✅ Service Worker enregistré:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error);
    return null;
  }
}

/**
 * Demander la permission de notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('⚠️  Notifications non supportées par ce navigateur');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Créer un abonnement push
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscriptionData | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('✅ Abonnement push créé:', subscription);
    return subscription as unknown as PushSubscriptionData;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'abonnement push:', error);
    return null;
  }
}

/**
 * Convertir une clé VAPID (Base64 URL-safe) en Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}
