import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// ============================================
// JOURNAL D'ACTIVITÉ (FONDATEUR)
// ============================================

// Récupérer le journal d'activité
router.get('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { entityType, limit } = req.query;

    let query = supabase
      .from('activity_log')
      .select(`
        *,
        users!activity_log_user_id_fkey(first_name, last_name, username, role)
      `)
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (limit) {
      query = query.limit(parseInt(limit as string));
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ activities: data });
  } catch (error: any) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du journal d\'activité' });
  }
});

export const activityLogRoutes = router;
