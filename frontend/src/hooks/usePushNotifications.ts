/**
 * Hook pour gérer les notifications Web Push
 */

import { useEffect, useState } from 'react';
import { tokenStorage } from '../services/authService';
import { pushService, registerServiceWorker, requestNotificationPermission, createPushSubscription } from '../services/pushService';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const enablePushNotifications = async () => {
    if (!isSupported) {
      console.log('⚠️  Notifications push non supportées');
      return false;
    }

    setIsLoading(true);

    try {
      // 1. Demander la permission
      const notificationPermission = await requestNotificationPermission();
      setPermission(notificationPermission);

      if (notificationPermission !== 'granted') {
        console.log('❌ Permission de notifications refusée');
        return false;
      }

      // 2. Enregistrer le service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        console.log('❌ Erreur lors de l\'enregistrement du service worker');
        return false;
      }

      // 3. Obtenir la clé publique VAPID
      const vapidPublicKey = await pushService.getVapidPublicKey();
      if (!vapidPublicKey) {
        console.log('❌ Erreur lors de la récupération de la clé VAPID');
        return false;
      }

      // 4. Créer l'abonnement push
      const subscription = await createPushSubscription(registration, vapidPublicKey);
      if (!subscription) {
        console.log('❌ Erreur lors de la création de l\'abonnement push');
        return false;
      }

      // 5. Enregistrer l'abonnement auprès du backend
      const token = tokenStorage.getToken();
      if (!token) {
        console.log('❌ Token d\'authentification manquant');
        return false;
      }

      await pushService.subscribe(subscription, token);
      setIsSubscribed(true);
      console.log('✅ Notifications push activées avec succès');

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'activation des notifications push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disablePushNotifications = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await pushService.unsubscribe(subscription.endpoint, token);
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      console.log('✅ Notifications push désactivées');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la désactivation des notifications push:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    enablePushNotifications,
    disablePushNotifications,
  };
}
