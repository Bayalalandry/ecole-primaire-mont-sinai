import express, { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticateToken, AuthRequest, requireTeacherOrDirector, requireDirector } from '../middleware/auth';

const router: Router = express.Router();

// Statistiques du tableau de bord enseignant (ou directeur avec classes assignées)
router.get('/teacher/dashboard-stats', authenticateToken, requireTeacherOrDirector, async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;

    // Récupérer l'année scolaire actuelle
    const { data: currentYear } = await supabase
      .from('school_years')
      .select('id, year_label')
      .eq('is_current', true)
      .single();

    if (!currentYear) {
      return res.json({
        totalStudents: 0,
        pendingGrades: 0,
        overdueTuition: 0,
      });
    }

    // Récupérer les classes de l'enseignant
    // Vérifier d'abord s'il y a des assignations avec school_year_id
    const { data: assignmentsWithYear } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', teacherId)
      .not('school_year_id', 'is', null);

    let assignments;
    if (assignmentsWithYear && assignmentsWithYear.length > 0) {
      // Si des assignations avec school_year_id existent, filtrer par l'année actuelle
      const { data } = await supabase
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId)
        .eq('school_year_id', currentYear.id);
      assignments = data;
    } else {
      // Sinon, retourner toutes les assignations (pour compatibilité avec les anciennes)
      const { data } = await supabase
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId);
      assignments = data;
    }

    if (!assignments || assignments.length === 0) {
      return res.json({
        totalStudents: 0,
        pendingGrades: 0,
        overdueTuition: 0,
      });
    }

    const classIds = assignments.map((a: any) => a.class_id);

    // Compter le nombre total d'élèves dans ces classes
    // Filtrer par l'année scolaire actuelle si possible
    let studentsQuery = supabase
      .from('students')
      .select('id')
      .in('current_class_id', classIds)
      .eq('status', 'active');

    // Vérifier si la colonne school_year existe (c'est une chaîne, pas un ID)
    const { data: testStudents } = await supabase
      .from('students')
      .select('school_year')
      .limit(1);

    if (testStudents && testStudents.length > 0) {
      // La colonne school_year existe, filtrer par l'année actuelle
      studentsQuery = studentsQuery.eq('school_year', currentYear.year_label);
    }

    const { data: students } = await studentsQuery;

    const totalStudents = students?.length || 0;

    // Compter les moyennes à saisir (élèves sans moyenne pour cette année)
    const { data: grades } = await supabase
      .from('student_annual_grades')
      .select('student_id')
      .eq('school_year_id', currentYear.id);

    const gradedStudentIds = grades?.map((g: any) => g.student_id) || [];
    
    // Compter combien d'élèves de l'enseignant ont déjà une moyenne
    const studentIds = students?.map((s: any) => s.id) || [];
    const gradedInMyClass = gradedStudentIds.filter(id => studentIds.includes(id)).length;
    
    const pendingGrades = totalStudents - gradedInMyClass;

    // Compter les scolarités en retard (pour simplifier, on utilise un pourcentage basé sur la date actuelle)
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // 1-12

    // Si on est après le 15 du mois, considérer comme retard
    let overdueTuition = 0;
    if (month >= 9 && month <= 6) { // Période scolaire
      const day = currentDate.getDate();
      if (day > 15) {
        // Environ 30% des élèves peuvent être en retard (estimation simplifiée)
        overdueTuition = Math.round(totalStudents * 0.3);
      }
    }

    // Déterminer le trimestre en cours en utilisant les dates configurées
    let currentTrimester = 'Vacances';
    try {
      const { data: trimesters } = await supabase
        .from('trimesters')
        .select('*')
        .eq('school_year', currentYear.year_label)
        .order('trimester_number');

      if (trimesters && trimesters.length > 0) {
        const today = new Date();
        for (const trimester of trimesters) {
          const startDate = new Date(trimester.start_date);
          const endDate = new Date(trimester.end_date);

          if (today >= startDate && today <= endDate) {
            currentTrimester = `${trimester.trimester_number}er`;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error loading trimesters:', error);
      // Fallback à l'ancienne logique si erreur
      if (month >= 9 && month <= 11) {
        currentTrimester = '1er';
      } else if (month >= 12 || month === 1) {
        currentTrimester = '2ème';
      } else if (month >= 2 && month <= 4) {
        currentTrimester = '3ème';
      }
    }

    res.json({
      totalStudents,
      pendingGrades: Math.max(0, pendingGrades),
      overdueTuition,
      currentTrimester,
    });
  } catch (error: any) {
    console.error('Teacher dashboard stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Statistiques du tableau de bord directeur
router.get('/director/dashboard-stats', authenticateToken, requireDirector, async (req: AuthRequest, res: Response) => {
  try {
    // Compter le nombre total d'enseignants actifs
    const { data: teachers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'teacher');

    const totalTeachers = teachers?.length || 0;

    // Compter le nombre total d'élèves actifs
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('status', 'active');

    const totalStudents = students?.length || 0;

    // Déterminer le trimestre en cours en utilisant les dates configurées
    let currentTrimester = 'Vacances';
    try {
      const { data: currentYear } = await supabase
        .from('school_years')
        .select('year_label')
        .eq('is_current', true)
        .maybeSingle();

      if (currentYear) {
        const { data: trimesters } = await supabase
          .from('trimesters')
          .select('*')
          .eq('school_year', currentYear.year_label)
          .order('trimester_number');

        if (trimesters && trimesters.length > 0) {
          const today = new Date();
          for (const trimester of trimesters) {
            const startDate = new Date(trimester.start_date);
            const endDate = new Date(trimester.end_date);

            if (today >= startDate && today <= endDate) {
              currentTrimester = `${trimester.trimester_number}er`;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading trimesters:', error);
      // Fallback à l'ancienne logique si erreur
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // 1-12
      if (month >= 9 && month <= 11) {
        currentTrimester = '1er';
      } else if (month >= 12 || month === 1) {
        currentTrimester = '2ème';
      } else if (month >= 2 && month <= 4) {
        currentTrimester = '3ème';
      }
    }

    res.json({
      totalTeachers,
      totalStudents,
      currentTrimester,
    });
  } catch (error: any) {
    console.error('Director dashboard stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export { router as dashboardRoutes };
