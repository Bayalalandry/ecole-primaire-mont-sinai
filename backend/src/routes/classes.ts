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

    // Récupérer les affectations enseignant-classe
    const { data: assignments, error: assignError } = await supabase
      .from('teacher_class_assignments')
      .select('*');
    
    if (assignError) {
      console.error('Error loading assignments:', assignError);
    }

    // Récupérer les informations des enseignants
    const teacherIds = [...new Set((assignments || []).map((a: any) => a.teacher_id))];
    let teacherMap: any = {};
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', teacherIds);
      teacherMap = (teachers || []).reduce((acc: any, teacher: any) => {
        acc[teacher.id] = `${teacher.first_name} ${teacher.last_name}`;
        return acc;
      }, {});
    }

    // Formater les données pour inclure les enseignants
    const classesWithTeachers = (data || []).map((cls: any) => {
      const classAssignments = (assignments || []).filter((a: any) => a.class_id === cls.id);
      const teachers = classAssignments.map((a: any) => ({
        id: a.teacher_id,
        name: teacherMap[a.teacher_id] || null,
        school_year: a.school_year
      }));

      console.log(`Class ${cls.name}:`, {
        assignments: classAssignments.length,
        teachers: teachers.length,
        teacherNames: teachers.map((t: any) => t.name)
      });

      return {
        ...cls,
        teachers
      };
    });

    console.log('Sending classes with teachers:', classesWithTeachers.map((c: any) => ({ name: c.name, teachers: c.teachers.length })));
    res.json({ classes: classesWithTeachers });
  } catch (error: any) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des classes' });
  }
});

export { router as classRoutes };
