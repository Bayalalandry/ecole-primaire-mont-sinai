import express, { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { authenticateToken, AuthRequest, requireFounder, requireTeacherOrDirector, requireTeacher } from '../middleware/auth';
import { logActivity } from '../services/authService';
import { createNotification } from '../services/notificationService';

const router: Router = express.Router();

// Utilitaire pour gérer les paramètres de route qui peuvent être des tableaux
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// ============================================
// GESTION DES MOYENNES ANNUELLES (ENSEIGNANT)
// ============================================

// Récupérer les classes d'un enseignant ou d'un directeur
router.get('/my-classes', authenticateToken, requireTeacherOrDirector, async (req: AuthRequest, res: Response) => {
  try {
    const { schoolYear } = req.query;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Récupérer l'ID de l'année scolaire
    let schoolYearData;
    if (schoolYear) {
      schoolYearData = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();
    } else {
      schoolYearData = await supabase
        .from('school_years')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();
    }

    if (!schoolYearData) {
      return res.json({ classes: [] });
    }

    // Vérifier si c'est un objet de réponse Supabase ou les données directes
    const schoolYearId = schoolYearData.data ? schoolYearData.data.id : schoolYearData.id;

    if (!schoolYearId) {
      return res.json({ classes: [] });
    }

    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', req.user?.id)
      .eq('school_year_id', schoolYearId);

    if (!assignments || assignments.length === 0) {
      return res.json({ classes: [] });
    }

    const classIds = assignments.map((a: any) => a.class_id);

    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', classIds);

    res.json({ classes: classes || [] });
  } catch (error: any) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des classes' });
  }
});

// Récupérer les élèves d'une classe pour la saisie des moyennes
router.get('/students/:classId', authenticateToken, requireTeacherOrDirector, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { schoolYear } = req.query;

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!schoolYearData) {
      return res.status(404).json({ error: 'Année scolaire non trouvée' });
    }

    const schoolYearId = schoolYearData.id;

    // Vérifier que l'enseignant est assigné à cette classe
    const { data: assignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', req.user?.id)
      .eq('class_id', classId)
      .eq('school_year_id', schoolYearId)
      .maybeSingle();

    if (!assignment) {
      return res.status(403).json({ error: 'Vous n\'êtes pas assigné à cette classe' });
    }

    // Récupérer les élèves de cette classe (tous les élèves actifs, sans filtre d'année scolaire)
    const { data: students } = await supabase
      .from('students')
      .select('id, unique_identifier, matricule, first_name, last_name')
      .eq('current_class_id', classId)
      .eq('status', 'active');

    // Récupérer les moyennes déjà saisies
    const { data: grades } = await supabase
      .from('student_annual_grades')
      .select('student_id, final_grade')
      .eq('school_year_id', schoolYearData.id);

    // Combiner les données
    const studentsWithGrades = students?.map(student => {
      const grade = grades?.find(g => g.student_id === student.id);
      return {
        ...student,
        annualGrade: grade?.final_grade || null,
      };
    }) || [];

    res.json({ students: studentsWithGrades });
  } catch (error: any) {
    console.error('Get students for grades error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des élèves' });
  }
});

// Enregistrer une moyenne annuelle pour un élève
router.post('/grades', authenticateToken, requireTeacherOrDirector, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, schoolYear, finalGrade } = req.body;

    if (!studentId || !schoolYear || finalGrade === undefined) {
      return res.status(400).json({ error: 'Champs requis: studentId, schoolYear, finalGrade' });
    }

    if (finalGrade < 0 || finalGrade > 10) {
      return res.status(400).json({ error: 'La moyenne doit être entre 0 et 10' });
    }

    // Vérifier que l'élève appartient à une classe de l'enseignant
    const { data: student } = await supabase
      .from('students')
      .select('current_class_id, first_name, last_name')
      .eq('id', studentId)
      .single();

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!schoolYearData) {
      return res.status(404).json({ error: 'Année scolaire non trouvée' });
    }

    // Vérifier si le passage a déjà été validé pour cet élève
    const { data: existingDecision } = await supabase
      .from('passage_decisions')
      .select('id')
      .eq('student_id', studentId)
      .eq('school_year_id', schoolYearData.id)
      .maybeSingle();

    if (existingDecision) {
      return res.status(403).json({ error: 'Le passage a déjà été validé pour cet élève. Modification impossible.' });
    }

    const { data: assignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', req.user?.id)
      .eq('class_id', student.current_class_id)
      .eq('school_year_id', schoolYearData.id)
      .maybeSingle();

    if (!assignment) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à saisir les moyennes de cet élève' });
    }

    // Insérer ou mettre à jour la moyenne
    const { data, error } = await supabase
      .from('student_annual_grades')
      .upsert({
        student_id: studentId,
        school_year_id: schoolYearData.id,
        final_grade: finalGrade,
        recorded_by: req.user?.id,
      }, {
        onConflict: 'student_id,school_year_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier le fondateur que les moyennes ont été saisies
    try {
      const { data: founder } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'founder')
        .limit(1)
        .single();

      if (founder) {
        const { data: className } = await supabase
          .from('classes')
          .select('name')
          .eq('id', student.current_class_id)
          .single();

        await createNotification(
          founder.id,
          'grade_recorded',
          'Moyenne saisie',
          `Une moyenne de ${finalGrade}/20 a été saisie pour ${student.first_name} ${student.last_name} (${className?.name}).`,
          'student_annual_grade',
          data.id
        );
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({ message: 'Moyenne enregistrée avec succès', grade: data });
  } catch (error: any) {
    console.error('Save grade error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la moyenne' });
  }
});

// Récupérer toutes les moyennes d'une classe
router.get('/grades/:classId', authenticateToken, requireTeacherOrDirector, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { schoolYear } = req.query;

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!schoolYearData) {
      return res.status(404).json({ error: 'Année scolaire non trouvée' });
    }

    const schoolYearId = schoolYearData.id;

    // Vérifier que l'enseignant est assigné à cette classe
    const { data: assignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', req.user?.id)
      .eq('class_id', classId)
      .eq('school_year_id', schoolYearId)
      .maybeSingle();

    if (!assignment) {
      return res.status(403).json({ error: 'Vous n\'êtes pas assigné à cette classe' });
    }

    // Récupérer les élèves de cette classe
    const { data: students } = await supabase
      .from('students')
      .select('id, unique_identifier, matricule, first_name, last_name')
      .eq('current_class_id', classId)
      .eq('status', 'active');

    // Récupérer les moyennes
    const { data: grades } = await supabase
      .from('student_annual_grades')
      .select('student_id, final_grade, recorded_at')
      .eq('school_year_id', schoolYearData.id);

    // Combiner les données
    const studentsWithGrades = students?.map(student => {
      const grade = grades?.find(g => g.student_id === student.id);
      return {
        ...student,
        finalGrade: grade?.final_grade || null,
        recordedAt: grade?.recorded_at || null,
      };
    }) || [];

    res.json({ grades: studentsWithGrades });
  } catch (error: any) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des moyennes' });
  }
});

// ============================================
// GESTION DES SEUILS DE PASSAGE (FONDATEUR)
// ============================================

// Récupérer tous les seuils de passage
router.get('/passing-grades', authenticateToken, requireFounder, async (req: AuthRequest, res: Response) => {
  try {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, passing_grade')
      .order('name');

    res.json({ classes: classes || [] });
  } catch (error: any) {
    console.error('Get passing grades error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des seuils' });
  }
});

// Mettre à jour le seuil de passage d'une classe
router.put('/passing-grades/:classId', authenticateToken, requireFounder, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { passingGrade } = req.body;

    console.log('Update passing grade request:', { classId, passingGrade });

    if (!passingGrade || passingGrade < 0 || passingGrade > 10) {
      return res.status(400).json({ error: 'Le seuil doit être entre 0 et 10' });
    }

    const { data, error } = await supabase
      .from('classes')
      .update({ passing_grade: passingGrade })
      .eq('id', classId)
      .select()
      .maybeSingle();

    console.log('Supabase update result:', { data, error });

    if (error) throw error;

    if (!data) {
      console.log('Class not found for ID:', classId);
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    res.json({ message: 'Seuil mis à jour avec succès', class: data });
  } catch (error: any) {
    console.error('Update passing grade error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du seuil' });
  }
});

// ============================================
// PROPOSITION DE STATUT DE PASSAGE
// ============================================

// Générer les propositions de passage pour une classe
router.post('/proposals/:classId', authenticateToken, requireFounder, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { schoolYear } = req.body;

    if (!schoolYear) {
      return res.status(400).json({ error: 'schoolYear requis' });
    }

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!schoolYearData) {
      return res.status(404).json({ error: 'Année scolaire non trouvée' });
    }

    // Récupérer le seuil de passage de la classe
    const { data: classData } = await supabase
      .from('classes')
      .select('passing_grade')
      .eq('id', classId)
      .single();

    if (!classData) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    // Récupérer les élèves de cette classe
    const { data: students } = await supabase
      .from('students')
      .select('id, unique_identifier, matricule, first_name, last_name')
      .eq('current_class_id', classId)
      .eq('status', 'active');

    if (!students || students.length === 0) {
      return res.json({ proposals: [] });
    }

    // Récupérer les moyennes
    const { data: grades } = await supabase
      .from('student_annual_grades')
      .select('student_id, final_grade')
      .eq('school_year_id', schoolYearData.id);

    const proposals = students.map((student: any) => {
      const grade = grades?.find(g => g.student_id === student.id)?.final_grade || 0;
      const proposedStatus = grade >= classData.passing_grade ? 'passed' : 'repeating';

      return {
        studentId: student.id,
        studentName: `${student.last_name} ${student.first_name}`,
        uniqueIdentifier: student.unique_identifier,
        matricule: student.matricule,
        finalGrade: grade,
        passingGrade: classData.passing_grade,
        proposedStatus,
      };
    });

    res.json({ proposals });
  } catch (error: any) {
    console.error('Generate proposals error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des propositions' });
  }
});

// ============================================
// VALIDATION DE PASSAGE (FONDATEUR)
// ============================================

// Valider le passage pour une classe
router.post('/validate/:classId', authenticateToken, requireFounder, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const classIdStr = getParam(classId);
    const { schoolYear, decisions } = req.body;

    if (!schoolYear || !decisions || !Array.isArray(decisions)) {
      return res.status(400).json({ error: 'schoolYear et decisions requis' });
    }

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!schoolYearData) {
      return res.status(404).json({ error: 'Année scolaire non trouvée' });
    }

    // Récupérer la classe actuelle et la classe suivante
    const { data: currentClass } = await supabase
      .from('classes')
      .select('name')
      .eq('id', classIdStr)
      .maybeSingle();

    if (!currentClass) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    // Déterminer la classe suivante
    const classOrder = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
    const currentIndex = classOrder.indexOf(currentClass.name);
    const nextClassName = currentIndex < classOrder.length - 1 ? classOrder[currentIndex + 1] : null;

    let nextClass = null;
    if (nextClassName) {
      const result = await supabase.from('classes').select('id').eq('name', nextClassName).maybeSingle();
      nextClass = result?.data || null;
    }

    // Vérifier que tous les élèves ont une moyenne avant validation
    const studentsWithoutGrades = decisions.filter(d => d.finalGrade === null || d.finalGrade === undefined);
    if (studentsWithoutGrades.length > 0) {
      return res.status(400).json({
        error: 'Impossible de valider : certains élèves n\'ont pas de moyenne',
        studentsWithoutGrades: studentsWithoutGrades.map(d => d.studentId),
      });
    }

    // Traiter chaque décision
    const results = [];
    for (const decision of decisions) {
      const { studentId, finalStatus, notes } = decision;

      // Enregistrer la décision de passage
      const result = await supabase
        .from('passage_decisions')
        .upsert({
          student_id: studentId,
          school_year_id: schoolYearData.id,
          class_id: classIdStr,
          proposed_status: decision.proposedStatus || 'passed',
          final_status: finalStatus,
          validated_by: req.user?.id,
          validated_at: new Date().toISOString(),
          notes,
        })
        .select()
        .maybeSingle();

      const passageDecision = result?.data || null;
      const passageError = result?.error || null;

      if (passageError) {
        console.error('Error saving passage decision:', passageError);
        continue;
      }

      // Mettre à jour l'élève selon le statut
      if (finalStatus === 'passed') {
        if (nextClass) {
          // Élève admis : passer à la classe supérieure
          await supabase
            .from('students')
            .update({ current_class_id: nextClass.id, status: 'active' })
            .eq('id', studentId);

          // Ajouter à l'historique scolaire
          await supabase
            .from('student_academic_history')
            .insert({
              student_id: studentId,
              class_id: classIdStr,
              school_year: schoolYear,
              final_grade: decision.finalGrade,
              status: 'passed',
            });
        } else {
          // CM2 admis : archiver comme 'departed' (fin de cycle)
          await supabase
            .from('students')
            .update({
              status: 'departed',
              departure_reason: 'fin de cycle',
              departure_date: new Date().toISOString().split('T')[0],
            })
            .eq('id', studentId);

          // Ajouter à l'historique scolaire
          await supabase
            .from('student_academic_history')
            .insert({
              student_id: studentId,
              class_id: classIdStr,
              school_year: schoolYear,
              final_grade: decision.finalGrade,
              status: 'transferred',
            });
        }
      } else {
        // Redoublant : rester dans la même classe
        await supabase
          .from('students')
          .update({ status: 'repeating' })
          .eq('id', studentId);

        // Ajouter à l'historique scolaire
        await supabase
          .from('student_academic_history')
          .insert({
            student_id: studentId,
            class_id: classIdStr,
            school_year: schoolYear,
            final_grade: decision.finalGrade,
            status: 'repeating',
          });
      }

      results.push(passageDecision);
    }

    await logActivity(req.user!.id, 'VALIDATE_PASSAGE', 'class', classIdStr, {
      classId: classIdStr,
      className: currentClass.name,
      decisionsCount: decisions.length,
    });

    // Notifier le fondateur et l'enseignant de la validation
    try {
      // Notifier le fondateur
      await createNotification(
        req.user!.id,
        'passage_validated',
        'Passage de classe validé',
        `Le passage de classe pour ${currentClass.name} a été validé pour ${decisions.length} élèves.`,
        'class',
        classIdStr
      );

      // Notifier l'enseignant responsable de la classe
      const { data: teacherAssignment } = await supabase
        .from('teacher_class_assignments')
        .select('teacher_id')
        .eq('class_id', classIdStr)
        .maybeSingle();

      if (teacherAssignment) {
        await createNotification(
          teacherAssignment.teacher_id,
          'passage_validated',
          'Passage de classe validé',
          `Le passage de classe pour votre classe ${currentClass.name} a été validé par le fondateur.`,
          'class',
          classIdStr
        );
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({ message: 'Validation effectuée avec succès', results });
  } catch (error: any) {
    console.error('Validate passage error:', error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
});

// Récupérer les décisions de passage pour une classe
router.get('/decisions/:classId', authenticateToken, requireFounder, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { schoolYear } = req.query;

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!schoolYearData) {
      return res.status(404).json({ error: 'Année scolaire non trouvée' });
    }

    const { data: decisions } = await supabase
      .from('passage_decisions')
      .select(`
        *,
        students(id, unique_identifier, matricule, first_name, last_name)
      `)
      .eq('class_id', classId)
      .eq('school_year_id', schoolYearData.id);

    res.json({ decisions: decisions || [] });
  } catch (error: any) {
    console.error('Get decisions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des décisions' });
  }
});

export { router as passageRoutes };
