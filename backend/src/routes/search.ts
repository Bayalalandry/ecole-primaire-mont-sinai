import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// ============================================
// RECHERCHE GLOBALE (FONDATEUR)
// ============================================

// Recherche globale (élèves et enseignants)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({ results: [] });
    }

    const searchTerm = query.toLowerCase();

    // Rechercher les élèves
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, current_class_id, status')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,matricule.ilike.%${searchTerm}%`)
      .limit(10);

    // Rechercher les enseignants
    const { data: teachers } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, role')
      .eq('role', 'teacher')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      .limit(10);

    const results = [
      ...(students?.map((s) => ({
        type: 'student',
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        matricule: s.matricule,
        classId: s.current_class_id,
        status: s.status,
      })) || []),
      ...(teachers?.map((t) => ({
        type: 'teacher',
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        username: t.username,
        role: t.role,
      })) || []),
    ];

    res.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

export const searchRoutes = router;
