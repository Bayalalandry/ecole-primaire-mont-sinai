import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// ============================================
// STATISTIQUES GLOBALES (FONDATEUR)
// ============================================

// Récupérer les statistiques globales pour une période
router.get('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, period, startDate, endDate } = req.query;

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND date >= '${startDate}' AND date <= '${endDate}'`;
    } else if (period === 'month') {
      const currentMonth = new Date().toISOString().substring(0, 7);
      dateFilter = `AND date LIKE '${currentMonth}%'`;
    } else if (period === 'trimester') {
      // Filtrer par trimestre (à implémenter selon la logique des trimestres)
      dateFilter = '';
    }

    // Récupérer l'ID de l'année scolaire pour les filtres
    let filterSchoolYearId = null;
    if (schoolYear) {
      const { data: syData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();
      filterSchoolYearId = syData?.id;
    }

    // Exécuter toutes les requêtes indépendantes en parallèle avec Promise.all
    const [
      tuitionPayments,
      tuitionSchoolYear,
      activeStudentsForTuition,
      salaryPayments,
      teacherSalaries,
      expenses,
      allStudents,
      teachers
    ] = await Promise.all([
      // 1. Statistiques scolarités
      supabase.from('tuition_payments').select('amount, payment_date, student_id').order('payment_date'),
      // Récupérer l'année scolaire actuelle pour les scolarités
      supabase.from('school_years').select('id').eq('is_current', true).maybeSingle(),
      // Calculer le total attendu : pour chaque élève actif, récupérer le tarif de sa classe
      supabase.from('students').select('id, current_class_id').eq('status', 'active'),
      // 2. Statistiques salaires
      supabase.from('salary_payments').select('amount, payment_date'),
      supabase.from('teacher_salaries').select('monthly_amount'),
      // 3. Statistiques dépenses
      supabase.from('expenses').select('category, amount'),
      // 4. Statistiques élèves
      supabase.from('students').select('status, current_class_id'),
      // 5. Statistiques enseignants
      supabase.from('users').select('id').eq('role', 'teacher'),
    ]);

    const totalTuitionCollected = tuitionPayments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const statsSchoolYearId = tuitionSchoolYear.data?.id;
    const tuitionClassIds = [...new Set(activeStudentsForTuition.data?.map(s => s.current_class_id) || [])];

    // Récupérer les tarifs de scolarité (dépend de activeStudentsForTuition et tuitionSchoolYear)
    const rateMap: any = {};
    let totalTuitionExpected = 0;
    if (tuitionClassIds.length > 0 && statsSchoolYearId) {
      const { data: tuitionRates } = await supabase
        .from('tuition_rates')
        .select('class_id, amount')
        .eq('school_year_id', statsSchoolYearId)
        .in('class_id', tuitionClassIds);

      tuitionRates?.forEach((rate) => {
        rateMap[rate.class_id] = Number(rate.amount);
      });

      totalTuitionExpected = activeStudentsForTuition.data?.reduce((sum, student) => {
        return sum + (rateMap[student.current_class_id] || 0);
      }, 0) || 0;
    }

    // Calculer le nombre d'élèves avec impayés
    let outstandingStudentsCount = 0;
    if (tuitionClassIds.length > 0 && statsSchoolYearId) {
      const paymentsByStudent: any = {};
      tuitionPayments.data?.forEach((p) => {
        if (!paymentsByStudent[p.student_id]) {
          paymentsByStudent[p.student_id] = 0;
        }
        paymentsByStudent[p.student_id] += Number(p.amount);
      });

      outstandingStudentsCount = activeStudentsForTuition.data?.filter((student) => {
        const expected = rateMap[student.current_class_id] || 0;
        const paid = paymentsByStudent[student.id] || 0;
        return expected - paid > 0;
      }).length || 0;
    }

    const totalTuitionOutstanding = Math.max(0, totalTuitionExpected - totalTuitionCollected);

    // 2. Statistiques salaires
    const totalSalariesPaid = salaryPayments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const totalSalariesExpected = teacherSalaries.data?.reduce((sum, r) => sum + Number(r.monthly_amount), 0) || 0;
    const totalSalariesOutstanding = totalSalariesExpected - totalSalariesPaid;

    // 3. Statistiques dépenses
    const totalExpenses = expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const expensesByCategory: any = {};
    expenses.data?.forEach((e) => {
      if (!expensesByCategory[e.category]) {
        expensesByCategory[e.category] = 0;
      }
      expensesByCategory[e.category] += Number(e.amount);
    });

    // 4. Statistiques élèves
    const activeStudents = allStudents.data?.filter(s => s.status === 'active').length || 0;
    const repeatingStudents = allStudents.data?.filter(s => s.status === 'repeating').length || 0;
    const departedStudents = allStudents.data?.filter(s => s.status === 'departed').length || 0;

    const studentsByClass: any = {};
    allStudents.data?.forEach((s) => {
      if (!studentsByClass[s.current_class_id]) {
        studentsByClass[s.current_class_id] = { active: 0, repeating: 0, departed: 0 };
      }
      if (s.status === 'active') studentsByClass[s.current_class_id].active++;
      if (s.status === 'repeating') studentsByClass[s.current_class_id].repeating++;
      if (s.status === 'departed') studentsByClass[s.current_class_id].departed++;
    });

    // Récupérer les noms des classes (dépend de allStudents)
    const studentClassIds = Object.keys(studentsByClass);
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', studentClassIds.length > 0 ? studentClassIds : ['00000000-0000-0000-0000-000000000000']);

    const classNameMap: any = {};
    classes?.forEach((c) => {
      classNameMap[c.id] = c.name;
    });

    const activeTeachersCount = teachers.data?.length || 0;

    // 6. Bilan financier
    const totalRevenue = totalTuitionCollected;
    const totalExpensesTotal = totalSalariesPaid + totalExpenses;
    const financialBalance = totalRevenue - totalExpensesTotal;

    res.json({
      tuition: {
        totalCollected: totalTuitionCollected,
        totalExpected: totalTuitionExpected,
        totalOutstanding: totalTuitionOutstanding,
        outstandingStudentsCount,
      },
      salaries: {
        totalPaid: totalSalariesPaid,
        totalExpected: totalSalariesExpected,
        totalOutstanding: totalSalariesOutstanding,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      students: {
        total: allStudents.data?.length || 0,
        active: activeStudents,
        repeating: repeatingStudents,
        departed: departedStudents,
        byClass: Object.entries(studentsByClass).map(([classId, counts]) => ({
          className: classNameMap[classId] || 'Inconnue',
          active: (counts as any).active,
          repeating: (counts as any).repeating,
          departed: (counts as any).departed,
        })),
      },
      teachers: {
        total: activeTeachersCount,
      },
      financial: {
        totalRevenue,
        totalExpenses: totalExpensesTotal,
        balance: financialBalance,
      },
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export const statisticsRoutes = router;
