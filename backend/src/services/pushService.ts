/**
 * Service pour gérer les notifications Web Push
 */

import webpush from 'web-push';
import { supabase } from './supabase';

// Configuration VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Clés VAPID configurées ?
const VAPID_CONFIGURED = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (!VAPID_CONFIGURED) {
  console.warn('⚠️  VAPID keys not configured in environment variables - Push notifications disabled');
} else {
  // Configurer web-push avec les clés VAPID
  webpush.setVapidDetails(
    'mailto:contact@ecole-primaire-mont-sinai.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

/**
 * Enregistrer un abonnement push pour un utilisateur
 */
export async function registerPushSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: subscription.user_id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.p256dh_key,
        auth_key: subscription.auth_key,
        user_agent: subscription.user_agent,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Error registering push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription registered for user:', subscription.user_id);
  } catch (error) {
    console.error('Error in registerPushSubscription:', error);
    throw error;
  }
}

/**
 * Désenregistrer un abonnement push
 */
export async function unregisterPushSubscription(endpoint: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error unregistering push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription unregistered:', endpoint);
  } catch (error) {
    console.error('Error in unregisterPushSubscription:', error);
    throw error;
  }
}

/**
 * Récupérer tous les abonnements push d'un utilisateur
 */
export async function getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPushSubscriptions:', error);
    throw error;
  }
}

/**
 * Envoyer une notification push à un utilisateur
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  // Si VAPID n'est pas configuré, ne rien faire
  if (!VAPID_CONFIGURED) {
    console.log('⚠️  Push notifications disabled - VAPID keys not configured');
    return;
  }

  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log('ℹ️  No push subscriptions found for user:', userId);
      return;
    }

    const notificationPayload = JSON.stringify(payload);

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log('✅ Push notification sent to user:', userId);
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription expired, remove it
          console.log('⚠️  Push subscription expired, removing:', subscription.endpoint);
          await unregisterPushSubscription(subscription.endpoint);
        } else {
          console.error('Error sending push notification:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    throw error;
  }
}

/**
 * Envoyer une notification push à plusieurs utilisateurs
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<void> {
  for (const userId of userIds) {
    await sendPushNotification(userId, payload);
  }
}

/**
 * Obtenir la clé publique VAPID (pour le frontend)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY || '';
}
