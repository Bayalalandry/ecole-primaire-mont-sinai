import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// Utilitaire pour gérer les paramètres de route qui peuvent être des tableaux
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// ============================================
// GESTION DES NOTIFICATIONS
// ============================================

// Récupérer les notifications de l'utilisateur connecté
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ notifications: data });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

// Compter les notifications non lues
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    console.log('Get unread count for user:', userId);

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Supabase error in unread-count:', error);
      throw error;
    }

    console.log('Unread count result:', count);
    res.json({ count: count || 0 });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    // Ne pas crasher le serveur, renvoyer 0 en cas d'erreur
    res.json({ count: 0 });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const idStr = getParam(id);
    const userId = req.user?.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', idStr)
      .eq('recipient_id', userId);

    if (error) throw error;

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications' });
  }
});

export const notificationRoutes = router;
