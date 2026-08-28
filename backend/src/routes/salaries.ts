import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { logActivity } from '../services/authService';

const router = Router();

// Générer un numéro de reçu unique pour les salaires
const generateSalaryReceiptNumber = async (): Promise<string> => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SAL${timestamp}${random}`;
};

// ============================================
// GESTION DES SALAIRES PAR ENSEIGNANT
// ============================================

// Créer ou mettre à jour un salaire pour un enseignant ou directeur
router.post('/salaries', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { teacherId, schoolYear, monthlyAmount, effectiveDate } = req.body;

    if (!teacherId || !monthlyAmount || !effectiveDate) {
      return res.status(400).json({ error: 'Champs requis: teacherId, monthlyAmount, effectiveDate' });
    }

    // Vérifier que l'utilisateur existe (enseignant ou directeur)
    const { data: userCheck } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', teacherId)
      .maybeSingle();

    if (!userCheck) {
      return res.status(400).json({ error: 'Utilisateur non trouvé' });
    }

    if (userCheck.role !== 'teacher' && userCheck.role !== 'director') {
      return res.status(400).json({ error: 'Seuls les enseignants et directeurs peuvent avoir un salaire' });
    }

    // Récupérer l'ID de l'année scolaire si fourni
    let schoolYearId = null;
    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        schoolYearId = schoolYearData.id;
      }
    }

    // Vérifier si un salaire existe déjà pour cet utilisateur et cette année scolaire
    let existingSalary = null;
    if (schoolYearId) {
      const { data: existing } = await supabase
        .from('teacher_salaries')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('school_year_id', schoolYearId)
        .maybeSingle();

      if (existing) {
        existingSalary = existing;
      }
    }

    if (existingSalary) {
      // Vérifier que le nouveau montant n'est pas inférieur aux paiements déjà effectués
      const { data: payments } = await supabase
        .from('salary_payments')
        .select('amount')
        .eq('teacher_id', teacherId)
        .eq('cancelled', false);

      const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

      if (parseFloat(monthlyAmount) < totalPaid) {
        return res.status(400).json({
          error: `Impossible de réduire le salaire. ${totalPaid} XOF ont déjà été versés.`
        });
      }

      // Mettre à jour le salaire existant
      const { data: updatedSalary, error } = await supabase
        .from('teacher_salaries')
        .update({
          monthly_amount: monthlyAmount,
          effective_date: effectiveDate,
        })
        .eq('id', existingSalary.id)
        .select()
        .single();

      if (error) throw error;

      await logActivity(req.user!.id, 'UPDATE_SALARY', 'teacher_salary', updatedSalary.id, {
        teacherId,
        monthlyAmount,
        effectiveDate
      });

      res.json({ message: 'Salaire mis à jour avec succès', salaryId: updatedSalary.id, updated: true });
    } else {
      // Créer un nouveau salaire
      const salaryData: any = {
        teacher_id: teacherId,
        monthly_amount: monthlyAmount,
        effective_date: effectiveDate,
      };

      if (schoolYearId) {
        salaryData.school_year_id = schoolYearId;
      }

      const { data: newSalary, error } = await supabase
        .from('teacher_salaries')
        .insert(salaryData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await logActivity(req.user!.id, 'CREATE_SALARY', 'teacher_salary', newSalary.id, {
        teacherId,
        monthlyAmount,
        effectiveDate
      });

      res.json({ message: 'Salaire enregistré avec succès', salaryId: newSalary.id, updated: false });
    }
  } catch (error: any) {
    console.error('Create salary error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du salaire' });
  }
});

// Récupérer tous les salaires
router.get('/salaries', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear } = req.query;

    let query = supabase
      .from('teacher_salaries')
      .select('*');

    if (schoolYear) {
      query = query.eq('school_year_id', (await supabase.from('school_years').select('id').eq('year_label', schoolYear).maybeSingle()).data?.id);
    }

    const { data, error } = await query.order('effective_date', { ascending: false });

    if (error) throw error;

    // Enrichir avec les informations des utilisateurs
    const enrichedData = await Promise.all(
      (data || []).map(async (salary: any) => {
        // Récupérer l'utilisateur (enseignant ou directeur)
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, username, role')
          .eq('id', salary.teacher_id)
          .maybeSingle();

        // Récupérer l'année scolaire
        const { data: schoolYearData } = await supabase
          .from('school_years')
          .select('year_label')
          .eq('id', salary.school_year_id)
          .maybeSingle();

        return {
          ...salary,
          users: userData,
          school_years: schoolYearData,
        };
      })
    );

    res.json({ salaries: enrichedData });
  } catch (error: any) {
    console.error('Get salaries error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salaires' });
  }
});

// ============================================
// GESTION DES PAIEMENTS DE SALAIRES
// ============================================

// Enregistrer un paiement de salaire
router.post('/salary-payments', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { teacherId, salaryId, amount, paymentMonth, paymentDate, schoolYear } = req.body;

    if (!teacherId || !amount || !paymentMonth || !paymentDate) {
      return res.status(400).json({ error: 'Champs requis: teacherId, amount, paymentMonth, paymentDate' });
    }

    // Normaliser le payment_month au format YYYY-MM-01 (premier jour du mois)
    const normalizedPaymentMonth = String(paymentMonth).substring(0, 7) + '-01'; // "2026-08-19" -> "2026-08-01"

    // Vérifier que le salaire existe pour cet enseignant
    const { data: salary } = await supabase
      .from('teacher_salaries')
      .select('monthly_amount')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (!salary) {
      return res.status(400).json({ error: 'Aucun salaire défini pour cet enseignant' });
    }

    // Calculer le total déjà versé pour ce mois
    const { data: existingPayments } = await supabase
      .from('salary_payments')
      .select('amount')
      .eq('teacher_id', teacherId)
      .eq('payment_month', normalizedPaymentMonth)
      .eq('cancelled', false);

    const totalPaid = (existingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remaining = salary.monthly_amount - totalPaid;

    // Vérifier que le paiement ne dépasse pas le reste à payer
    if (parseFloat(amount) > remaining) {
      return res.status(400).json({
        error: `Le montant dépasse le reste à payer. Reste: ${remaining} XOF, Tenté: ${amount} XOF`
      });
    }

    const receiptNumber = await generateSalaryReceiptNumber();

    const paymentData: any = {
      teacher_id: teacherId,
      amount: amount,
      payment_month: normalizedPaymentMonth,
      payment_date: paymentDate,
      receipt_number: receiptNumber,
      created_by: req.user?.id,
    };

    if (salaryId) {
      paymentData.salary_id = salaryId;
    }

    // Récupérer l'ID de l'année scolaire si fourni
    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        paymentData.school_year_id = schoolYearData.id;
      }
    }

    const { data, error } = await supabase
      .from('salary_payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logActivity(req.user!.id, 'CREATE_SALARY_PAYMENT', 'salary_payment', data.id, {
      amount: data.amount,
      teacherId: data.teacher_id,
      paymentMonth: data.payment_month,
      receiptNumber: data.receipt_number
    });

    // Enrichir avec les informations de l'utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name, username, role')
      .eq('id', teacherId)
      .maybeSingle();

    const enrichedPayment = {
      ...data,
      users: userData,
    };

    res.json({ message: 'Paiement enregistré avec succès', payment: enrichedPayment });
  } catch (error: any) {
    console.error('Create salary payment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du paiement' });
  }
});

// Récupérer tous les paiements de salaires
router.get('/salary-payments', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, teacherId, paymentMonth } = req.query;

    console.log('Get salary payments - params:', { schoolYear, teacherId, paymentMonth });

    let query = supabase
      .from('salary_payments')
      .select('*')
      .eq('cancelled', false);

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (paymentMonth) {
      query = query.eq('payment_month', paymentMonth);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) throw error;

    console.log('Raw payments data:', data);
    console.log('Number of payments:', data?.length || 0);

    // Récupérer les informations des enseignants/directeurs et années scolaires
    const enrichedData = await Promise.all(
      (data || []).map(async (payment: any) => {
        // Récupérer l'utilisateur (enseignant ou directeur)
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, username, role')
          .eq('id', payment.teacher_id)
          .maybeSingle();

        // Récupérer le salaire
        const { data: salaryData } = await supabase
          .from('teacher_salaries')
          .select('monthly_amount')
          .eq('id', payment.salary_id)
          .maybeSingle();

        // Récupérer l'année scolaire
        const { data: schoolYearData } = await supabase
          .from('school_years')
          .select('year_label')
          .eq('id', payment.school_year_id)
          .maybeSingle();

        // Récupérer l'utilisateur qui a créé le paiement
        const { data: createdByData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', payment.created_by)
          .maybeSingle();

        return {
          ...payment,
          users: userData,
          teacher_salaries: salaryData,
          school_years: schoolYearData,
          created_by_user: createdByData,
        };
      })
    );

    console.log('Enriched payments data:', enrichedData);

    // Filtrer par année scolaire si fourni
    let filteredData = enrichedData;
    if (schoolYear) {
      filteredData = enrichedData.filter((payment: any) =>
        payment.school_years?.year_label === schoolYear || !payment.school_year_id
      );
    }

    console.log('Filtered payments data:', filteredData);
    console.log('Sending response with payments:', filteredData.length);

    res.json({ payments: filteredData });
  } catch (error: any) {
    console.error('Get salary payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
  }
});

// Annuler un paiement de salaire (fondateur uniquement)
router.post('/salary-payments/:paymentId/cancel', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;
    const paymentIdStr = Array.isArray(paymentId) ? paymentId[0] : paymentId;

    const { data, error } = await supabase
      .from('salary_payments')
      .update({
        cancelled: true,
        cancelled_by: req.user?.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.user!.id, 'CANCEL_SALARY_PAYMENT', 'salary_payment', paymentIdStr, {
      cancelledBy: req.user?.id
    });

    res.json({ message: 'Paiement annulé avec succès', payment: data });
  } catch (error: any) {
    console.error('Cancel salary payment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation du paiement' });
  }
});

// ============================================
// CALCUL DES MONTANTS DÛ/VERSÉ/RESTE À PAYER
// ============================================

// Calculer la situation financière d'un enseignant pour un mois
router.get('/salary-balance/teacher/:teacherId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { teacherId } = req.params;
    const { paymentMonth } = req.query;

    // Récupérer le salaire actuel de l'enseignant
    const currentDate = new Date().toISOString().split('T')[0];
    const { data: salary } = await supabase
      .from('teacher_salaries')
      .select('*')
      .eq('teacher_id', teacherId)
      .lte('effective_date', currentDate)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!salary) {
      return res.status(404).json({ error: 'Aucun salaire trouvé pour cet enseignant' });
    }

    const totalDue = salary.monthly_amount;

    // Récupérer les paiements pour le mois spécifié
    let paymentsQuery = supabase
      .from('salary_payments')
      .select('amount, payment_date')
      .eq('teacher_id', teacherId)
      .eq('cancelled', false);

    if (paymentMonth) {
      paymentsQuery = paymentsQuery.eq('payment_month', paymentMonth);
    }

    const { data: payments } = await paymentsQuery;

    const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remaining = totalDue - totalPaid;

    res.json({
      teacherId,
      monthlyAmount: totalDue,
      totalPaid,
      remaining,
      paymentStatus: remaining < totalDue ? 'partial' : 'unpaid',
      lastPaymentDate: payments?.[0]?.payment_date || null,
    });
  } catch (error: any) {
    console.error('Get salary balance error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul du solde' });
  }
});

// Récupérer les soldes de tous les enseignants et directeurs pour un mois
router.get('/salary-outstanding', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { paymentMonth } = req.query;

    // Récupérer tous les enseignants et directeurs
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, role')
      .in('role', ['teacher', 'director']);

    if (!users) {
      return res.json({ outstanding: [] });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const outstandingList: any[] = [];

    for (const user of users) {
      // Récupérer le salaire actuel de l'utilisateur
      const { data: salary } = await supabase
        .from('teacher_salaries')
        .select('*')
        .eq('teacher_id', user.id)
        .lte('effective_date', currentDate)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!salary) continue;

      const totalDue = salary.monthly_amount;

      // Récupérer les paiements pour le mois spécifié
      let paymentsQuery = supabase
        .from('salary_payments')
        .select('amount, payment_date, payment_month')
        .eq('teacher_id', user.id)
        .eq('cancelled', false);

      if (paymentMonth) {
        // Normaliser le filtre pour correspondre au format YYYY-MM-01 (premier jour du mois)
        const normalizedFilterMonth = String(paymentMonth).substring(0, 7) + '-01';
        paymentsQuery = paymentsQuery.eq('payment_month', normalizedFilterMonth);
      }

      const { data: payments } = await paymentsQuery;

      const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const remaining = totalDue - totalPaid;

      if (remaining > 0) {
        const teacherName = `${user.last_name} ${user.first_name}${user.role === 'director' ? ' (Directeur)' : ''}`;

        outstandingList.push({
          teacherId: user.id,
          teacherName: teacherName,
          teacherUsername: user.username || '',
          monthlyAmount: totalDue,
          totalPaid,
          remaining,
          paymentStatus: remaining < totalDue ? 'partial' : 'unpaid',
          lastPaymentDate: payments?.[0]?.payment_date || null,
        });
      }
    }

    res.json({ outstanding: outstandingList });
  } catch (error: any) {
    console.error('Get salary outstanding error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des impayés' });
  }
});

export { router as salaryRoutes };
