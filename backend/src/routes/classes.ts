import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// Récupérer l'année scolaire actuelle
router.get('/school-years/current', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_current', true)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Get current school year error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'année scolaire' });
  }
});

// Lister toutes les classes avec leurs enseignants assignés
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Récupérer les affectations secrétaire-classe
    const { data: assignments, error: assignError } = await supabase
      .from('secretary_class_assignments')
      .select('*');
    
    if (assignError) {
      console.error('Error loading assignments:', assignError);
    }

    // Récupérer les informations des secrétaires
    const secretaryIds = [...new Set((assignments || []).map((a: any) => a.secretary_id))];
    let secretaryMap: any = {};
    if (secretaryIds.length > 0) {
      const { data: secretaries } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', secretaryIds);
      secretaryMap = (secretaries || []).reduce((acc: any, secretary: any) => {
        acc[secretary.id] = `${secretary.first_name} ${secretary.last_name}`;
        return acc;
      }, {});
    }

    // Formater les données pour inclure les secrétaires
    const classesWithSecretaries = (data || []).map((cls: any) => {
      const classAssignments = (assignments || []).filter((a: any) => a.class_id === cls.id);
      const secretaries = classAssignments.map((a: any) => ({
        id: a.secretary_id,
        name: secretaryMap[a.secretary_id] || null,
        school_year: a.school_year
      }));

      console.log(`Class ${cls.name}:`, {
        assignments: classAssignments.length,
        secretaries: secretaries.length,
        secretaryNames: secretaries.map((t: any) => t.name)
      });

      return {
        ...cls,
        secretaries
      };
    });

    console.log('Sending classes with secretaries:', classesWithSecretaries.map((c: any) => ({ name: c.name, secretaries: c.secretaries.length })));
    res.json({ classes: classesWithSecretaries });
  } catch (error: any) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des classes' });
  }
});

export { router as classRoutes };
