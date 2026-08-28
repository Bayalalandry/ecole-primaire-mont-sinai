import { supabase } from './supabase';

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
    return data;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    throw error;
  }
}
