import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// Lister tous les secrétaires
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, secretaries (*)')
      .in('role', ['secretary', 'director'])
      .order('last_name', { ascending: true });

    if (error) throw error;

    res.json({ secretaries: data || [] });
  } catch (error: any) {
    console.error('Get secretaries error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des secrétaires' });
  }
});

// Récupérer un secrétaire par ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*, secretaries (*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Secrétaire non trouvé' });
    }

    res.json({ secretary: data });
  } catch (error: any) {
    console.error('Get secretary error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du secrétaire' });
  }
});

export { router as secretaryRoutes };
