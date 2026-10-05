import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { createNotification } from '../services/notificationService';

const router = Router();

// Formater un montant en FCFA
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' FCFA';
};

// Récupérer le résumé des salaires d'un secrétaire
router.get('/summary/secretary/:secretaryId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { secretaryId } = req.params;
    const { schoolYear } = req.query;

    // Récupérer le salaire mensuel du secrétaire
    let salaryQuery = supabase
      .from('secretary_salaries')
      .select('*, school_years (*)')
      .eq('secretary_id', secretaryId)
      .order('effective_date', { ascending: false })
      .limit(1);

    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        salaryQuery = salaryQuery.eq('school_year_id', schoolYearData.id);
      }
    }

    const { data: salary, error: salaryError } = await salaryQuery.maybeSingle();

    const fixedSalary = salary?.monthly_amount || 0;

    // Récupérer tous les versements de salaire de l'enseignant
    let paymentsQuery = supabase
      .from('salary_payments')
      .select('amount')
      .eq('secretary_id', secretaryId)
      .eq('cancelled', false);

    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        paymentsQuery = paymentsQuery.eq('school_year_id', schoolYearData.id);
      }
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) throw paymentsError;

    const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalOutstanding = fixedSalary - totalPaid;

    res.json({
      fixedSalary,
      totalPaid,
      totalOutstanding,
    });
  } catch (error: any) {
    console.error('Get salary summary error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du résumé des salaires' });
  }
});

// Récupérer l'historique des versements de salaire d'un enseignant
router.get('/payments/teacher/:secretaryId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { secretaryId } = req.params;
    const { schoolYear } = req.query;

    let query = supabase
      .from('salary_payments')
      .select('*')
      .eq('secretary_id', secretaryId)
      .eq('cancelled', false)
      .order('payment_date', { ascending: false });

    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        query = query.eq('school_year_id', schoolYearData.id);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ payments: data || [] });
  } catch (error: any) {
    console.error('Get salary payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des versements' });
  }
});

// ============================================
// Routes pour SalaryPage (gestion des salaires)
// ============================================

// Récupérer tous les salaires (uniquement fondateur)
router.get('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear } = req.query;

    let schoolYearId = null;
    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      schoolYearId = schoolYearData?.id;
    }

    // Récupérer les salaires des secrétaires
    let secretaryQuery = supabase
      .from('secretary_salaries')
      .select('*, school_years (*)')
      .order('effective_date', { ascending: false });

    if (schoolYearId) {
      secretaryQuery = secretaryQuery.eq('school_year_id', schoolYearId);
    }

    const { data: secretarySalaries, error: secretaryError } = await secretaryQuery;

    if (secretaryError) throw secretaryError;

    // Récupérer les salaires des enseignants
    let teacherQuery = supabase
      .from('teacher_salaries')
      .select('*, school_years (*)')
      .order('effective_date', { ascending: false });

    if (schoolYearId) {
      teacherQuery = teacherQuery.eq('school_year_id', schoolYearId);
    }

    const { data: teacherSalaries, error: teacherError } = await teacherQuery;

    if (teacherError) throw teacherError;

    // Combiner les salaires avec un marqueur pour distinguer
    const combinedSalaries = [
      ...(secretarySalaries || []).map((s: any) => ({ ...s, type: 'secretary' })),
      ...(teacherSalaries || []).map((s: any) => ({ ...s, type: 'teacher' })),
    ];

    // Récupérer les informations des secrétaires/directeurs (users)
    const secretaryIds = (secretarySalaries || []).map((s: any) => s.secretary_id);
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .in('id', secretaryIds);

    // Récupérer les informations des enseignants (personnel)
    const teacherIds = (teacherSalaries || []).map((s: any) => s.teacher_id);
    const { data: teachersData } = await supabase
      .from('teachers')
      .select('id, first_name, last_name, class_id, classes (name)')
      .in('id', teacherIds);

    // Combiner les données avec gestion des cas manquants
    const salariesWithInfo = combinedSalaries.map((salary: any) => {
      if (salary.type === 'secretary') {
        const user = usersData?.find((u: any) => u.id === salary.secretary_id);
        return {
          ...salary,
          users: user || { id: salary.secretary_id, first_name: 'Inconnu', last_name: '', role: 'secretary' },
        };
      } else {
        const teacher = teachersData?.find((t: any) => t.id === salary.teacher_id);
        return {
          ...salary,
          users: {
            id: salary.teacher_id,
            first_name: teacher?.first_name || 'Inconnu',
            last_name: teacher?.last_name || '',
            role: 'teacher',
          },
          classes: teacher?.classes || null,
        };
      }
    });

    res.json({ salaries: salariesWithInfo || [] });
  } catch (error: any) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salaires' });
  }
});

// Récupérer tous les paiements de salaire (uniquement fondateur)
router.get('/payments', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, paymentMonth } = req.query;

    let query = supabase
      .from('salary_payments')
      .select('*')
      .eq('cancelled', false)
      .order('payment_date', { ascending: false });

    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        query = query.eq('school_year_id', schoolYearData.id);
      }
    }

    if (paymentMonth) {
      query = query.eq('payment_month', paymentMonth);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Récupérer les informations des enseignants et utilisateurs manuellement
    const secretaryIds = (data || []).map((p: any) => p.secretary_id);
    const { data: teachersData } = await supabase
      .from('teachers')
      .select('user_id, status')
      .in('user_id', secretaryIds);

    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .in('id', secretaryIds);

    // Combiner les données avec gestion des cas manquants
    const paymentsWithTeachers = (data || []).map((payment: any) => {
      const teacher = teachersData?.find((t: any) => t.user_id === payment.secretary_id);
      const user = usersData?.find((u: any) => u.id === payment.secretary_id);
      
      return {
        ...payment,
        teachers: teacher ? { ...teacher, users: user } : { user_id: payment.secretary_id, users: user || { id: payment.secretary_id, first_name: 'Enseignant', last_name: 'Inconnu' } },
      };
    });

    res.json({ payments: paymentsWithTeachers || [] });
  } catch (error: any) {
    console.error('Get salary payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
  }
});

// Récupérer les impayés de salaire (uniquement fondateur)
router.get('/outstanding', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, paymentMonth } = req.query;

    let schoolYearId = null;
    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();
      schoolYearId = schoolYearData?.id;
    }

    // Récupérer tous les salaires
    const { data: salaries } = await supabase
      .from('secretary_salaries')
      .select('*')
      .order('effective_date', { ascending: false });

    // Récupérer les informations des enseignants et utilisateurs
    const secretaryIds = (salaries || []).map((s: any) => s.secretary_id);
    const { data: teachersData } = await supabase
      .from('teachers')
      .select('user_id, status')
      .in('user_id', secretaryIds);

    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', secretaryIds);

    const outstanding: any[] = [];

    for (const salary of salaries || []) {
      // Calculer le total payé pour ce salaire
      let paymentsQuery = supabase
        .from('salary_payments')
        .select('amount')
        .eq('secretary_id', salary.secretary_id)
        .eq('cancelled', false);

      if (schoolYearId) {
        paymentsQuery = paymentsQuery.eq('school_year_id', schoolYearId);
      }

      const { data: payments } = await paymentsQuery;

      const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const totalOutstanding = Number(salary.monthly_amount) - totalPaid;

      if (totalOutstanding > 0) {
        const user = usersData?.find((u: any) => u.id === salary.secretary_id);
        outstanding.push({
          secretaryId: salary.secretary_id,
          teacherName: user ? `${user.last_name} ${user.first_name}` : 'Inconnu',
          monthlyAmount: salary.monthly_amount,
          totalPaid,
          totalOutstanding,
          schoolYearId: salary.school_year_id,
        });
      }
    }

    res.json({ outstanding });
  } catch (error: any) {
    console.error('Get salary outstanding error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des impayés' });
  }
});

// Créer un salaire
router.post('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { secretaryId, schoolYear, monthlyAmount, effectiveDate } = req.body;

    if (!secretaryId || !monthlyAmount || !effectiveDate) {
      return res.status(400).json({ error: 'Champs requis: secretaryId, monthlyAmount, effectiveDate' });
    }

    // Déterminer si c'est un enseignant (personnel) ou un secrétaire/directeur
    const isTeacher = secretaryId.startsWith('teacher-');
    const personnelId = isTeacher ? secretaryId.replace('teacher-', '') : secretaryId;

    // Récupérer l'ID de l'année scolaire
    let schoolYearId = null;
    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      schoolYearId = schoolYearData?.id || null;
    } else {
      // Si schoolYear n'est pas fourni, utiliser l'année scolaire actuelle
      const { data: currentYear } = await supabase
        .from('school_years')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      schoolYearId = currentYear?.id || null;
    }

    let data, error;
    if (isTeacher) {
      // Créer dans teacher_salaries
      const result = await supabase
        .from('teacher_salaries')
        .insert({
          teacher_id: personnelId,
          school_year_id: schoolYearId,
          monthly_amount: monthlyAmount,
          effective_date: effectiveDate,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Créer dans secretary_salaries
      const result = await supabase
        .from('secretary_salaries')
        .insert({
          secretary_id: personnelId,
          school_year_id: schoolYearId,
          monthly_amount: monthlyAmount,
          effective_date: effectiveDate,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    res.json({ salary: data });
  } catch (error: any) {
    console.error('Create salary error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du salaire' });
  }
});

// Créer un paiement de salaire
router.post('/payments', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { secretaryId, salaryId, amount, paymentMonth, paymentDate } = req.body;

    if (!secretaryId || !amount || !paymentMonth || !paymentDate) {
      return res.status(400).json({ error: 'Champs requis: secretaryId, amount, paymentMonth, paymentDate' });
    }

    // Générer un numéro de reçu unique
    const receiptNumber = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('salary_payments')
      .insert({
        salary_id: salaryId,
        secretary_id: secretaryId,
        amount,
        payment_month: paymentMonth,
        payment_date: paymentDate,
        receipt_number: receiptNumber,
        created_by: req.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier l'enseignant du paiement
    try {
      await createNotification(
        secretaryId,
        'salary_payment',
        'Salaire payé',
        `Votre salaire de ${formatAmount(amount)} a été payé pour le mois de ${new Date(paymentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.`,
        'salary_payment',
        data.id
      );
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({ payment: data });
  } catch (error: any) {
    console.error('Create salary payment error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

// Annuler un paiement de salaire
router.post('/payments/:paymentId/cancel', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;

    const { data, error } = await supabase
      .from('salary_payments')
      .update({
        cancelled: true,
        cancelled_by: req.user?.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    res.json({ payment: data });
  } catch (error: any) {
    console.error('Cancel salary payment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation du paiement' });
  }
});

export { router as salaryRoutes };
