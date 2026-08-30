import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();

// Récupérer le résumé des salaires d'un enseignant
router.get('/summary/teacher/:teacherId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { teacherId } = req.params;
    const { schoolYear } = req.query;

    // Récupérer le salaire mensuel de l'enseignant
    let salaryQuery = supabase
      .from('teacher_salaries')
      .select('*, school_years (*)')
      .eq('teacher_id', teacherId)
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
      .eq('teacher_id', teacherId)
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
router.get('/payments/teacher/:teacherId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { teacherId } = req.params;
    const { schoolYear } = req.query;

    let query = supabase
      .from('salary_payments')
      .select('*')
      .eq('teacher_id', teacherId)
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

// Récupérer tous les salaires
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolYear } = req.query;

    let query = supabase
      .from('teacher_salaries')
      .select('*, school_years (*), teachers (*, users (*))')
      .order('effective_date', { ascending: false });

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

    res.json({ salaries: data || [] });
  } catch (error: any) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salaires' });
  }
});

// Récupérer tous les paiements de salaire
router.get('/payments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, paymentMonth } = req.query;

    let query = supabase
      .from('salary_payments')
      .select('*, teachers (*, users (*))')
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

    res.json({ payments: data || [] });
  } catch (error: any) {
    console.error('Get salary payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
  }
});

// Récupérer les impayés de salaire
router.get('/outstanding', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, paymentMonth } = req.query;

    // Pour l'instant, retourner une liste vide
    // La logique complète sera implémentée ultérieurement
    res.json({ outstanding: [] });
  } catch (error: any) {
    console.error('Get salary outstanding error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des impayés' });
  }
});

// Créer un salaire
router.post('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { teacherId, schoolYear, monthlyAmount, effectiveDate } = req.body;

    if (!teacherId || !monthlyAmount || !effectiveDate) {
      return res.status(400).json({ error: 'Champs requis: teacherId, monthlyAmount, effectiveDate' });
    }

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    const schoolYearId = schoolYearData?.id || null;

    const { data, error } = await supabase
      .from('teacher_salaries')
      .insert({
        teacher_id: teacherId,
        school_year_id: schoolYearId,
        monthly_amount: monthlyAmount,
        effective_date: effectiveDate,
      })
      .select()
      .single();

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
    const { teacherId, salaryId, amount, paymentMonth, paymentDate } = req.body;

    if (!teacherId || !amount || !paymentMonth || !paymentDate) {
      return res.status(400).json({ error: 'Champs requis: teacherId, amount, paymentMonth, paymentDate' });
    }

    // Générer un numéro de reçu unique
    const receiptNumber = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('salary_payments')
      .insert({
        salary_id: salaryId,
        teacher_id: teacherId,
        amount,
        payment_month: paymentMonth,
        payment_date: paymentDate,
        receipt_number: receiptNumber,
        created_by: req.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

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
