import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// ============================================
// EXPORT/SAUVEGARDE GLOBALE (FONDATEUR)
// ============================================

// Exporter toutes les données de l'école
router.get('/export', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const backup: any = {
      export_date: new Date().toISOString(),
      school_name: 'École Primaire',
      tables: {},
    };

    // Exporter les classes
    const { data: classes } = await supabase.from('classes').select('*');
    backup.tables.classes = classes || [];

    // Exporter les années scolaires
    const { data: schoolYears } = await supabase.from('school_years').select('*');
    backup.tables.school_years = schoolYears || [];

    // Exporter les trimestres
    const { data: trimesters } = await supabase.from('trimesters').select('*');
    backup.tables.trimesters = trimesters || [];

    // Exporter les utilisateurs (sans mots de passe)
    const { data: users } = await supabase
      .from('users')
      .select('id, username, role, first_name, last_name, is_active, created_at');
    backup.tables.users = users || [];

    // Exporter les élèves
    const { data: students } = await supabase.from('students').select('*');
    backup.tables.students = students || [];

    // Exporter les tarifs de scolarité
    const { data: tuitionRates } = await supabase.from('tuition_rates').select('*');
    backup.tables.tuition_rates = tuitionRates || [];

    // Exporter les paiements de scolarité
    const { data: tuitionPayments } = await supabase.from('tuition_payments').select('*');
    backup.tables.tuition_payments = tuitionPayments || [];

    // Exporter les salaires enseignants
    const { data: teacherSalaries } = await supabase.from('teacher_salaries').select('*');
    backup.tables.teacher_salaries = teacherSalaries || [];

    // Exporter les paiements de salaires
    const { data: salaryPayments } = await supabase.from('salary_payments').select('*');
    backup.tables.salary_payments = salaryPayments || [];

    // Exporter les dépenses
    const { data: expenses } = await supabase.from('expenses').select('*');
    backup.tables.expenses = expenses || [];

    // Exporter les décisions de passage
    const { data: passageDecisions } = await supabase.from('passage_decisions').select('*');
    backup.tables.passage_decisions = passageDecisions || [];

    // Exporter l'historique scolaire
    const { data: academicHistory } = await supabase.from('student_academic_history').select('*');
    backup.tables.student_academic_history = academicHistory || [];

    // Exporter les assignations enseignant-classe
    const { data: assignments } = await supabase.from('teacher_class_assignments').select('*');
    backup.tables.teacher_class_assignments = assignments || [];

    // Exporter les notes annuelles
    const { data: grades } = await supabase.from('student_annual_grades').select('*');
    backup.tables.student_annual_grades = grades || [];

    // Exporter le journal d'activité
    const { data: activityLog } = await supabase.from('activity_log').select('*');
    backup.tables.activity_log = activityLog || [];

    // Exporter les notifications
    const { data: notifications } = await supabase.from('notifications').select('*');
    backup.tables.notifications = notifications || [];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup_ecole_${new Date().toISOString().split('T')[0]}.json`);
    res.json(backup);
  } catch (error: any) {
    console.error('Backup export error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export de la sauvegarde' });
  }
});

export const backupRoutes = router;
