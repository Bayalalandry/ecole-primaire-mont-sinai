const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export const notificationService = {
  // Récupérer les notifications
  async getNotifications(token: string, unreadOnly?: boolean): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');

    const response = await fetch(`${API_URL}/notifications?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des notifications');
    }

    const data = await response.json();
    return data.notifications || [];
  },

  // Compter les notifications non lues
  async getUnreadCount(token: string): Promise<number> {
    console.log('[NotificationService] Fetching unread count...');
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[NotificationService] Error fetching unread count:', response.status);
      throw new Error('Erreur lors du comptage des notifications');
    }

    const data = await response.json();
    console.log('[NotificationService] Unread count:', data.count);
    return data.count || 0;
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour de la notification');
    }
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(token: string): Promise<void> {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour des notifications');
    }
  },
};
