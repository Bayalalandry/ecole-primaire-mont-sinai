import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder, requireFounderOrDirector } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { logActivity } from '../services/authService';

const router = Router();

// Déterminer le trimestre à partir d'une date
const getTrimesterFromDate = async (date: Date, schoolYear: string): Promise<number> => {
  try {
    // Essayer de récupérer le trimestre depuis la base de données
    let query = supabase.from('trimesters').select('*').order('trimester_number', { ascending: true });

    try {
      query = query.eq('school_year', schoolYear);
    } catch (e) {
      console.log('school_year column may not exist in trimesters, skipping filter');
    }

    const { data: trimesters, error } = await query;

    if (!error && trimesters && trimesters.length > 0) {
      const targetDate = date.toISOString().split('T')[0];
      for (const trimester of trimesters) {
        if (targetDate >= trimester.start_date && targetDate <= trimester.end_date) {
          return trimester.trimester_number;
        }
      }
    }

    // Fallback: calcul par défaut
    const month = date.getMonth() + 1; // 1-12
    if (month >= 9 || month <= 11) return 1; // Septembre à Novembre
    if (month >= 12 || month <= 2) return 2; // Décembre à Février
    return 3; // Mars à Mai
  } catch (error) {
    // En cas d'erreur, utiliser le calcul par défaut
    const month = date.getMonth() + 1; // 1-12
    if (month >= 9 || month <= 11) return 1; // Septembre à Novembre
    if (month >= 12 || month <= 2) return 2; // Décembre à Février
    return 3; // Mars à Mai
  }
};

// Générer un numéro de reçu unique
const generateReceiptNumber = async (): Promise<string> => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC${timestamp}${random}`;
};

// ============================================
// GESTION DES TARIFS PAR CLASSE
// ============================================

// Créer ou mettre à jour un tarif de scolarité
router.post('/rates', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { classId, schoolYear, amount, effectiveDate } = req.body;

    if (!classId || !amount || !effectiveDate) {
      return res.status(400).json({ error: 'Champs requis: classId, amount, effectiveDate' });
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

    // Vérifier si un tarif existe déjà pour cette classe et cette année scolaire
    let existingRate = null;
    if (schoolYearId) {
      const { data: existing } = await supabase
        .from('tuition_rates')
        .select('*')
        .eq('class_id', classId)
        .eq('school_year_id', schoolYearId)
        .maybeSingle();

      if (existing) {
        existingRate = existing;
      }
    }

    if (existingRate) {
      // Mettre à jour le tarif existant
      const { data: updatedRate, error } = await supabase
        .from('tuition_rates')
        .update({
          amount: amount,
          effective_date: effectiveDate,
        })
        .eq('id', existingRate.id)
        .select()
        .single();

      if (error) throw error;

      await logActivity(req.user!.id, 'UPDATE_TUITION_RATE', 'tuition_rate', updatedRate.id, {
        classId,
        amount,
      });

      res.json({ message: 'Tarif mis à jour avec succès', rateId: updatedRate.id, updated: true });
    } else {
      // Créer un nouveau tarif
      const rateData: any = {
        class_id: classId,
        amount: amount,
        effective_date: effectiveDate,
      };

      if (schoolYearId) {
        rateData.school_year_id = schoolYearId;
      }

      const { data: newRate, error } = await supabase
        .from('tuition_rates')
        .insert(rateData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await logActivity(req.user!.id, 'CREATE_TUITION_RATE', 'tuition_rate', newRate.id, {
        classId,
        amount,
      });

      res.json({ message: 'Tarif enregistré avec succès', rateId: newRate.id, updated: false });
    }
  } catch (error: any) {
    console.error('Create tuition rate error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du tarif' });
  }
});

// Récupérer tous les tarifs de scolarité
router.get('/rates', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { schoolYear } = req.query;

    let query = supabase.from('tuition_rates').select('*, classes(name)');

    // Essayer de filtrer par school_year via school_year_id
    if (schoolYear) {
      try {
        // D'abord récupérer l'ID de l'année scolaire
        const { data: schoolYearData } = await supabase
          .from('school_years')
          .select('id')
          .eq('year_label', schoolYear)
          .maybeSingle();

        if (schoolYearData) {
          query = query.eq('school_year_id', schoolYearData.id);
        }
      } catch (e) {
        console.log('school_year filter does not work, skipping filter');
      }
    }

    const { data, error } = await query.order('effective_date', { ascending: false });

    if (error) {
      // Si l'erreur est liée à school_year_id, réessayer sans le filtre
      console.log('Retrying without school_year_id filter');
      const { data: data2, error: error2 } = await supabase
        .from('tuition_rates')
        .select('*, classes(name)')
        .order('effective_date', { ascending: false });
      if (error2) throw error2;
      res.json({ rates: data2 });
      return;
    }

    // Récupérer les années scolaires pour enrichir les données
    if (data && data.length > 0) {
      const schoolYearIds = [...new Set(data.map((r: any) => r.school_year_id).filter(Boolean))];
      if (schoolYearIds.length > 0) {
        const { data: schoolYears } = await supabase
          .from('school_years')
          .select('id, year_label')
          .in('id', schoolYearIds);

        const schoolYearMap: any = {};
        for (const sy of schoolYears || []) {
          schoolYearMap[sy.id] = sy.year_label;
        }

        // Enrichir les données avec l'année scolaire
        (data as any[]).forEach((rate) => {
          if (rate.school_year_id) {
            rate.school_year = schoolYearMap[rate.school_year_id] || 'Non défini';
          }
        });
      }
    }

    res.json({ rates: data });
  } catch (error: any) {
    console.error('Get tuition rates error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tarifs' });
  }
});

// Récupérer le tarif actuel pour une classe
router.get('/rates/class/:classId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { classId } = req.params;
    const { schoolYear } = req.query;

    const currentDate = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('tuition_rates')
      .select('*')
      .eq('class_id', classId)
      .lte('effective_date', currentDate)
      .order('effective_date', { ascending: false })
      .limit(1);

    if (schoolYear) {
      try {
        query = query.eq('school_year', schoolYear);
      } catch (e) {
        console.log('school_year column does not exist, skipping filter');
      }
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.message?.includes('school_year')) {
        const { data: data2, error: error2 } = await supabase
          .from('tuition_rates')
          .select('*')
          .eq('class_id', classId)
          .lte('effective_date', currentDate)
          .order('effective_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error2) throw error2;
        res.json({ rate: data2 });
        return;
      }
      throw error;
    }

    res.json({ rate: data });
  } catch (error: any) {
    console.error('Get class tuition rate error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du tarif' });
  }
});

// ============================================
// GESTION DES VERSEMENTS DE SCOLARITÉ
// ============================================

// Enregistrer un versement de scolarité
router.post('/payments', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { studentId, schoolYear, amount, paymentDate } = req.body;

    if (!studentId || !amount || !paymentDate) {
      return res.status(400).json({ error: 'Champs requis: studentId, amount, paymentDate' });
    }

    const receiptNumber = await generateReceiptNumber();
    const paymentDateObj = new Date(paymentDate);
    const trimester = await getTrimesterFromDate(paymentDateObj, schoolYear || '2026-2027');

    const paymentData: any = {
      student_id: studentId,
      amount: amount,
      payment_date: paymentDate,
      trimester: trimester,
      receipt_number: receiptNumber,
      created_by: req.user?.id,
      status: 'paid',
    };

    // Ajouter school_year seulement si fourni
    if (schoolYear) {
      paymentData.school_year = schoolYear;
    }

    const { data: payment, error } = await supabase
      .from('tuition_payments')
      .insert(paymentData)
      .select(`
        *,
        students(first_name, last_name, matricule),
        users!tuition_payments_created_by_fkey(first_name, last_name)
      `)
      .single();

    if (error) {
      // Si l'erreur est liée à school_year, réessayer sans
      if (error.message?.includes('school_year')) {
        delete paymentData.school_year;
        const { data: payment2, error: error2 } = await supabase
          .from('tuition_payments')
          .insert(paymentData)
          .select(`
            *,
            students(first_name, last_name, matricule),
            users!tuition_payments_created_by_fkey(first_name, last_name)
          `)
          .single();
        if (error2) throw error2;
        await logActivity(req.user!.id, 'CREATE_PAYMENT', 'tuition_payment', payment2.id, {
          amount: payment2.amount,
          studentId: payment2.student_id,
          receiptNumber: payment2.receipt_number
        });
        res.json({ message: 'Versement enregistré avec succès', payment: payment2 });
        return;
      }
      throw error;
    }

    await logActivity(req.user!.id, 'CREATE_PAYMENT', 'tuition_payment', payment.id, {
      amount: payment.amount,
      studentId: payment.student_id,
      receiptNumber: payment.receipt_number
    });
    res.json({ message: 'Versement enregistré avec succès', payment });
  } catch (error: any) {
    console.error('Create tuition payment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du versement' });
  }
});

// Récupérer tous les versements
router.get('/payments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, studentId, classId, trimester } = req.query;

    let query = supabase
      .from('tuition_payments')
      .select(`
        *,
        students(first_name, last_name, matricule, current_class_id, classes(name)),
        users!tuition_payments_created_by_fkey(first_name, last_name),
        school_years(year_label)
      `)
      .eq('cancelled', false);

    if (schoolYear) {
      try {
        query = query.eq('school_year', schoolYear);
      } catch (e) {
        console.log('school_year column does not exist, skipping filter');
      }
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (trimester) {
      query = query.eq('trimester', parseInt(trimester as string));
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) {
      if (error.message?.includes('school_year')) {
        let query2 = supabase
          .from('tuition_payments')
          .select(`
            *,
            students(first_name, last_name, matricule, current_class_id, classes(name)),
            users!tuition_payments_created_by_fkey(first_name, last_name),
            school_years(year_label)
          `)
          .eq('cancelled', false);

        if (studentId) query2 = query2.eq('student_id', studentId);
        if (trimester) query2 = query2.eq('trimester', parseInt(trimester as string));

        const { data: data2, error: error2 } = await query2.order('payment_date', { ascending: false });
        if (error2) throw error2;

        let filteredData = data2;
        if (classId) {
          filteredData = data2?.filter((p: any) => p.students?.current_class_id === classId);
        }
        res.json({ payments: filteredData });
        return;
      }
      throw error;
    }

    // Filtrer par classe si demandé
    let filteredData = data;
    if (classId) {
      filteredData = data?.filter((p: any) => p.students?.current_class_id === classId);
    }

    res.json({ payments: filteredData });
  } catch (error: any) {
    console.error('Get tuition payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des versements' });
  }
});

// Récupérer l'historique des versements d'un élève
router.get('/payments/student/:studentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const { schoolYear } = req.query;

    let query = supabase
      .from('tuition_payments')
      .select(`
        *,
        students(first_name, last_name, matricule),
        users!tuition_payments_created_by_fkey(first_name, last_name),
        school_years(year_label)
      `)
      .eq('student_id', studentId)
      .eq('cancelled', false);

    if (schoolYear) {
      try {
        query = query.eq('school_year', schoolYear);
      } catch (e) {
        console.log('school_year column does not exist, skipping filter');
      }
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) {
      if (error.message?.includes('school_year')) {
        const { data: data2, error: error2 } = await supabase
          .from('tuition_payments')
          .select(`
            *,
            students(first_name, last_name, matricule),
            users!tuition_payments_created_by_fkey(first_name, last_name)
          `)
          .eq('student_id', studentId)
          .eq('cancelled', false)
          .order('payment_date', { ascending: false });
        if (error2) throw error2;
        res.json({ payments: data2 });
        return;
      }
      throw error;
    }

    res.json({ payments: data });
  } catch (error: any) {
    console.error('Get student tuition payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des versements' });
  }
});

// Annuler un versement (fondateur uniquement)
router.post('/payments/:paymentId/cancel', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { paymentId } = req.params;

    const { data, error } = await supabase
      .from('tuition_payments')
      .update({
        cancelled: true,
        cancelled_by: req.user?.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Versement annulé avec succès', payment: data });
  } catch (error: any) {
    console.error('Cancel tuition payment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation du versement' });
  }
});

// ============================================
// CALCUL DES MONTANTS DÛ/VERSÉ/RESTE À PAYER
// ============================================

// Calculer la situation financière d'un élève
router.get('/balance/student/:studentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const { schoolYear } = req.query;

    // Récupérer la classe de l'élève
    const { data: student } = await supabase
      .from('students')
      .select('current_class_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Récupérer le nom de la classe
    let className = '';
    if (student.current_class_id) {
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', student.current_class_id)
        .maybeSingle();
      className = classData?.name || '';
    }

    // Récupérer le tarif actuel pour cette classe
    const currentDate = new Date().toISOString().split('T')[0];
    let rateQuery = supabase
      .from('tuition_rates')
      .select('*')
      .eq('class_id', student.current_class_id)
      .lte('effective_date', currentDate)
      .order('effective_date', { ascending: false })
      .limit(1);

    if (schoolYear) {
      try {
        rateQuery = rateQuery.eq('school_year', schoolYear);
      } catch (e) {
        console.log('school_year column does not exist, skipping filter');
      }
    }

    const { data: rate, error: rateError } = await rateQuery.maybeSingle();

    if (rateError && rateError.message?.includes('school_year')) {
      const { data: rate2 } = await supabase
        .from('tuition_rates')
        .select('*')
        .eq('class_id', student.current_class_id)
        .lte('effective_date', currentDate)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      const totalDue = rate2?.amount || 0;

      const { data: payments } = await supabase
        .from('tuition_payments')
        .select('amount')
        .eq('student_id', studentId)
        .eq('cancelled', false);

      const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
      const remaining = totalDue - totalPaid;

      res.json({
        studentId,
        classId: student.current_class_id,
        className,
        schoolYear,
        totalDue,
        totalPaid,
        remaining,
        paymentStatus: remaining <= 0 ? 'paid' : remaining < totalDue ? 'partial' : 'unpaid',
      });
      return;
    }

    const totalDue = rate?.amount || 0;

    // Récupérer les versements de l'élève
    let paymentsQuery = supabase
      .from('tuition_payments')
      .select('amount')
      .eq('student_id', studentId)
      .eq('cancelled', false);

    if (schoolYear) {
      try {
        paymentsQuery = paymentsQuery.eq('school_year', schoolYear);
      } catch (e) {
        console.log('school_year column does not exist, skipping filter');
      }
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError && paymentsError.message?.includes('school_year')) {
      const { data: payments2 } = await supabase
        .from('tuition_payments')
        .select('amount')
        .eq('student_id', studentId)
        .eq('cancelled', false);

      const totalPaid = payments2?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
      const remaining = totalDue - totalPaid;

      res.json({
        studentId,
        classId: student.current_class_id,
        className,
        schoolYear,
        totalDue,
        totalPaid,
        remaining,
        paymentStatus: remaining <= 0 ? 'paid' : remaining < totalDue ? 'partial' : 'unpaid',
      });
      return;
    }

    const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
    const remaining = totalDue - totalPaid;

    res.json({
      studentId,
      classId: student.current_class_id,
      className,
      schoolYear,
      totalDue,
      totalPaid,
      remaining,
      paymentStatus: remaining <= 0 ? 'paid' : remaining < totalDue ? 'partial' : 'unpaid',
    });
  } catch (error: any) {
    console.error('Get student balance error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul du solde' });
  }
});

// ============================================
// LISTE DES IMPAYÉS
// ============================================

// Récupérer la liste des impayés
router.get('/outstanding', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, classId, trimester } = req.query;
    console.log('=== OUTSTANDING REQUEST ===');
    console.log('Filters:', { schoolYear, classId, trimester });

    // Récupérer tous les élèves (pas filtrer par statut pour l'instant)
    let studentsQuery = supabase
      .from('students')
      .select('id, first_name, last_name, matricule, current_class_id, status');

    console.log('Query built, executing...');

    if (classId) {
      studentsQuery = studentsQuery.eq('current_class_id', classId);
    }

    const { data: students, error: studentsError } = await studentsQuery;
    console.log('Students found:', students?.length || 0);

    if (!students) {
      console.log('No students found');
      return res.json({ outstanding: [] });
    }

    // Récupérer les noms des classes
    const classIds = [...new Set(students.map((s: any) => s.current_class_id).filter(Boolean))];
    const classMap: any = {};
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
          .select('id, name')
          .in('id', classIds);
      for (const cls of classes || []) {
        classMap[cls.id] = cls.name;
      }
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const outstandingList: any[] = [];

    for (const student of students) {
      // Récupérer le tarif actuel pour cette classe
      let rateQuery = supabase
        .from('tuition_rates')
        .select('*')
        .eq('class_id', student.current_class_id)
        .lte('effective_date', currentDate)
        .order('effective_date', { ascending: false })
        .limit(1);

      if (schoolYear) {
        try {
          rateQuery = rateQuery.eq('school_year', schoolYear);
        } catch (e) {
          console.log('school_year column does not exist, skipping filter');
        }
      }

      const { data: rate, error: rateError } = await rateQuery.maybeSingle();

      let totalDue = rate?.amount || 0;

      // Si erreur ou pas de tarif, réessayer sans filtre school_year
      if (rateError || totalDue === 0) {
        console.log(`Retrying rate query for ${student.matricule} without school_year filter`);
        const { data: rate2 } = await supabase
          .from('tuition_rates')
          .select('*')
          .eq('class_id', student.current_class_id)
          .lte('effective_date', currentDate)
          .order('effective_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        totalDue = rate2?.amount || 0;
      }

      console.log(`Student ${student.matricule}: class ${student.current_class_id}, rate: ${totalDue}, status: ${student.status}`);

      // Si pas de tarif, ne pas inclure dans les impayés
      if (totalDue === 0) {
        console.log(`Student ${student.matricule}: no rate, skipping`);
        continue;
      }

      // Récupérer les versements de l'élève
      let paymentsQuery = supabase
        .from('tuition_payments')
        .select('amount, payment_date, trimester')
        .eq('student_id', student.id)
        .eq('cancelled', false);

      if (schoolYear) {
        try {
          paymentsQuery = paymentsQuery.eq('school_year', schoolYear);
        } catch (e) {
          console.log('school_year column does not exist, skipping filter');
        }
      }

      if (trimester) {
        paymentsQuery = paymentsQuery.eq('trimester', parseInt(trimester as string));
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      let totalPaid = 0;

      // Si erreur ou pas de versements, réessayer sans filtre school_year
      if (paymentsError || !payments || payments.length === 0) {
        console.log(`Retrying payments query for ${student.matricule} without school_year filter`);
        const { data: payments2 } = await supabase
          .from('tuition_payments')
          .select('amount, payment_date, trimester')
          .eq('student_id', student.id)
          .eq('cancelled', false);

        totalPaid = payments2?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
      } else {
        totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
      }

      const remaining = totalDue - totalPaid;

      // Inclure si reste à payer > 0
      if (remaining > 0) {
        outstandingList.push({
          studentId: student.id,
          studentName: `${student.last_name} ${student.first_name}`,
          matricule: student.matricule,
          classId: student.current_class_id,
          className: classMap[student.current_class_id] || '',
          totalDue,
          totalPaid,
          remaining,
          paymentStatus: remaining < totalDue ? 'partial' : 'unpaid',
          lastPaymentDate: payments?.[0]?.payment_date || null,
        });
      }
    }

    console.log('Outstanding list:', outstandingList.length);
    res.json({ outstanding: outstandingList });
  } catch (error: any) {
    console.error('Get outstanding payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des impayés' });
  }
});

// ============================================
// Routes pour la gestion des trimestres
// ============================================

// Récupérer les trimestres pour une année scolaire
router.get('/trimesters', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { schoolYear } = req.query;

    let query = supabase.from('trimesters').select('*');

    if (schoolYear) {
      try {
        query = query.eq('school_year', schoolYear);
      } catch (e) {
        console.log('school_year column may not exist, skipping filter');
      }
    }

    const { data, error } = await query.order('trimester_number', { ascending: true });

    if (error) {
      // Si l'erreur est liée à school_year, réessayer sans le filtre
      if (error.message?.includes('school_year')) {
        const { data: data2, error: error2 } = await supabase
          .from('trimesters')
          .select('*')
          .order('trimester_number', { ascending: true });
        if (error2) throw error2;
        res.json({ trimesters: data2 || [] });
        return;
      }
      throw error;
    }

    res.json({ trimesters: data || [] });
  } catch (error: any) {
    console.error('Get trimesters error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des trimestres' });
  }
});

// Créer ou mettre à jour des trimestres pour une année scolaire
router.post('/trimesters', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { schoolYear, trimesters } = req.body;

    if (!schoolYear || !trimesters || !Array.isArray(trimesters)) {
      return res.status(400).json({ error: 'Champs requis: schoolYear, trimesters (array)' });
    }

    // Pour chaque trimestre, utiliser upsert pour éviter les doublons
    const results = [];
    for (const t of trimesters) {
      const trimesterData: any = {
        school_year: schoolYear,
        trimester_number: t.trimester_number,
        start_date: t.start_date,
        end_date: t.end_date,
      };

      // Essayer upsert avec school_year
      const { data, error } = await supabase
        .from('trimesters')
        .upsert(trimesterData, { onConflict: 'school_year,trimester_number' })
        .select()
        .maybeSingle();

      if (error) {
        // Si l'erreur est liée à school_year, essayer sans ce champ pour la contrainte
        if (error.message?.includes('school_year') || error.message?.includes('unique constraint')) {
          // Essayer de trouver et mettre à jour le trimestre existant
          const { data: existing } = await supabase
            .from('trimesters')
            .select('*')
            .eq('trimester_number', t.trimester_number)
            .maybeSingle();

          if (existing) {
            const { data: updated, error: updateError } = await supabase
              .from('trimesters')
              .update({
                start_date: t.start_date,
                end_date: t.end_date,
              })
              .eq('id', existing.id)
              .select()
              .single();

            if (updateError) throw updateError;
            results.push(updated);
          } else {
            // Créer sans school_year
            const trimesterData2 = {
              trimester_number: t.trimester_number,
              start_date: t.start_date,
              end_date: t.end_date,
            };
            const { data: created, error: createError } = await supabase
              .from('trimesters')
              .insert(trimesterData2)
              .select()
              .single();
            if (createError) throw createError;
            results.push(created);
          }
        } else {
          throw error;
        }
      } else if (data) {
        results.push(data);
      }
    }

    res.json({ message: 'Trimestres enregistrés avec succès', trimesters: results });
  } catch (error: any) {
    console.error('Save trimesters error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement des trimestres' });
  }
});

export { router as tuitionRoutes };
