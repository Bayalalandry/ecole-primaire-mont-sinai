import { supabase } from './supabase';
import { sendPushNotification } from './pushService';

export async function createNotification(
  recipientId: string,
  type: string,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
) {
  try {
    console.log('[NotificationService] Creating notification:', { recipientId, type, title });
    const { data, error } = await supabase.from('notifications').insert({
      recipient_id: recipientId,
      type,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
    }).select().single();

    if (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw error;
    }

    console.log('[NotificationService] Notification created successfully:', data.id);

    // Envoyer une notification push
    try {
      await sendPushNotification(recipientId, {
        title,
        body: message,
        icon: '/logo_ecole_primaire_le_mont_sinai_app.png',
        badge: '/logo_ecole_primaire_le_mont_sinai_app.png',
        data: {
          type,
          entityType,
          entityId,
        },
      });
      console.log('[NotificationService] Push notification sent successfully');
    } catch (pushError) {
      console.error('[NotificationService] Error sending push notification:', pushError);
      // Ne pas bloquer si la notification push échoue
    }

    return data;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    throw error;
  }
}
