import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// Lister tous les enseignants
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, teachers (*)')
      .in('role', ['teacher', 'director'])
      .order('last_name', { ascending: true });

    if (error) throw error;

    res.json({ teachers: data || [] });
  } catch (error: any) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enseignants' });
  }
});

// Récupérer un enseignant par ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*, teachers (*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    res.json({ teacher: data });
  } catch (error: any) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'enseignant' });
  }
});

export { router as teacherRoutes };
