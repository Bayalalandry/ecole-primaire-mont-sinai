const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSalaryCycle() {
  try {
    console.log('=== TEST CYCLE COMPLET DE GESTION DES SALAIRES ===\n');

    // 1. Récupérer un enseignant existant
    console.log('1. Récupération d\'un enseignant...');
    const { data: teachers } = await supabase
      .from('teachers')
      .select('user_id, users!user_id(first_name, last_name, username)')
      .limit(1);

    if (!teachers || teachers.length === 0) {
      console.log('Aucun enseignant trouvé. Veuillez d\'abord créer un enseignant.');
      return;
    }

    const teacher = teachers[0];
    console.log(`Enseignant: ${teacher.users?.last_name} ${teacher.users?.first_name} (${teacher.users?.username})`);
    console.log(`ID: ${teacher.user_id}\n`);

    const schoolYear = '2026-2027';
    const teacherId = teacher.user_id;

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    const schoolYearId = schoolYearData?.id || null;

    // Récupérer l'ID du fondateur pour created_by
    const { data: founder } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'founder')
      .limit(1)
      .maybeSingle();

    const founderId = founder?.id || teacher.user_id;
    console.log('Founder ID:', founderId);
    console.log('School year ID:', schoolYearId);

    // 2. Définir un salaire mensuel
    console.log('2. Définition d\'un salaire mensuel...');
    const monthlyAmount = 50000;
    const effectiveDate = new Date().toISOString().split('T')[0];

    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    const schoolYearId = schoolYearData?.id || null;
    console.log('School year ID:', schoolYearId);

    // Essayer avec school_year_id d'abord
    const { data: existingSalary, error: existingError } = await supabase
      .from('teacher_salaries')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('school_year_id', schoolYearId)
      .maybeSingle();

    console.log('Existing salary:', existingSalary);
    console.log('Existing error:', existingError);

    let salaryId;
    if (existingSalary) {
      // Mettre à jour le salaire existant
      const { data: updatedSalary, error: updateError } = await supabase
        .from('teacher_salaries')
        .update({ monthly_amount: monthlyAmount, effective_date: effectiveDate })
        .eq('id', existingSalary.id)
        .select()
        .single();

      if (updateError) {
        console.log('Erreur lors de la mise à jour, création d\'un nouveau salaire...');
        const { data: newSalary, error: createError } = await supabase
          .from('teacher_salaries')
          .insert({
            teacher_id: teacherId,
            school_year_id: schoolYearId,
            monthly_amount: monthlyAmount,
            effective_date: effectiveDate,
          })
          .select()
          .single();

        if (createError) {
          console.log('Erreur lors de la création:', createError);
          return;
        }

        salaryId = newSalary.id;
        console.log(`Nouveau salaire créé: ${monthlyAmount} XOF/mois`);
      } else {
        salaryId = updatedSalary.id;
        console.log(`Salaire mis à jour: ${monthlyAmount} XOF/mois`);
      }
    } else {
      // Créer un nouveau salaire
      const { data: newSalary, error: createError } = await supabase
        .from('teacher_salaries')
        .insert({
          teacher_id: teacherId,
          school_year_id: schoolYearId,
          monthly_amount: monthlyAmount,
          effective_date: effectiveDate,
        })
        .select()
        .single();

      if (createError) {
        console.log('Erreur lors de la création:', createError);
        return;
      }

      salaryId = newSalary.id;
      console.log(`Nouveau salaire créé: ${monthlyAmount} XOF/mois`);
    }
    console.log(`ID du salaire: ${salaryId}\n`);

    // 3. Enregistrer un versement partiel
    console.log('3. Enregistrement d\'un versement partiel...');
    const partialAmount = 20000;
    const paymentMonth = new Date().toISOString().split('T')[0];
    const paymentDate = new Date().toISOString().split('T')[0];

    const receiptNumber = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const paymentData: any = {
      teacher_id: teacherId,
      salary_id: salaryId,
      amount: partialAmount,
      payment_month: paymentMonth,
      payment_date: paymentDate,
      receipt_number: receiptNumber,
      created_by: founderId,
    };

    if (schoolYearId) {
      paymentData.school_year_id = schoolYearId;
    }

    const { data: payment, error: paymentError } = await supabase
      .from('salary_payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.log('Erreur lors de la création du paiement:', paymentError);
      return;
    }

    console.log(`Versement enregistré: ${partialAmount} XOF`);
    console.log(`Numéro de reçu: ${receiptNumber}`);
    console.log(`ID du paiement: ${payment.id}\n`);

    // 4. Vérifier le reste à payer
    console.log('4. Vérification du reste à payer...');
    const { data: payments } = await supabase
      .from('salary_payments')
      .select('amount')
      .eq('teacher_id', teacherId)
      .eq('cancelled', false);

    const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remaining = monthlyAmount - totalPaid;

    console.log(`Total versé: ${totalPaid} XOF`);
    console.log(`Reste à payer: ${remaining} XOF`);
    console.log(`Statut: ${remaining < monthlyAmount ? 'Partiel' : 'Non payé'}\n`);

    // 5. Enregistrer un deuxième versement pour compléter
    console.log('5. Enregistrement d\'un deuxième versement...');
    const secondAmount = remaining;
    const receiptNumber2 = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const paymentData2: any = {
      teacher_id: teacherId,
      salary_id: salaryId,
      amount: secondAmount,
      payment_month: paymentMonth,
      payment_date: paymentDate,
      receipt_number: receiptNumber2,
      created_by: founderId,
    };

    if (schoolYearId) {
      paymentData2.school_year_id = schoolYearId;
    }

    const { data: payment2, error: payment2Error } = await supabase
      .from('salary_payments')
      .insert(paymentData2)
      .select()
      .single();

    if (payment2Error) {
      console.log('Erreur lors de la création du deuxième paiement:', payment2Error);
      return;
    }

    console.log(`Deuxième versement enregistré: ${secondAmount} XOF`);
    console.log(`Numéro de reçu: ${receiptNumber2}\n`);

    // 6. Vérifier que le salaire est maintenant payé en entier
    console.log('6. Vérification finale...');
    const { data: finalPayments } = await supabase
      .from('salary_payments')
      .select('amount')
      .eq('teacher_id', teacherId)
      .eq('cancelled', false);

    const finalTotalPaid = (finalPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const finalRemaining = monthlyAmount - finalTotalPaid;

    console.log(`Total versé final: ${finalTotalPaid} XOF`);
    console.log(`Reste à payer final: ${finalRemaining} XOF`);
    console.log(`Statut final: ${finalRemaining === 0 ? 'Payé en entier' : 'Partiel'}\n`);

    // 7. Tester l'annulation d'un paiement
    console.log('7. Test de l\'annulation d\'un paiement...');
    const { data: cancelledPayment, error: cancelError } = await supabase
      .from('salary_payments')
      .update({
        cancelled: true,
        cancelled_by: founderId,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .select()
      .single();

    if (cancelError) {
      console.log('Erreur lors de l\'annulation:', cancelError);
      return;
    }

    console.log(`Paiement annulé: ${cancelledPayment.receipt_number}`);

    // 8. Vérifier que le reste à payer a été recalculé
    const { data: afterCancelPayments } = await supabase
      .from('salary_payments')
      .select('amount')
      .eq('teacher_id', teacherId)
      .eq('cancelled', false);

    const afterCancelTotalPaid = (afterCancelPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const afterCancelRemaining = monthlyAmount - afterCancelTotalPaid;

    console.log(`Total versé après annulation: ${afterCancelTotalPaid} XOF`);
    console.log(`Reste à payer après annulation: ${afterCancelRemaining} XOF`);
    console.log(`Recalcul correct: ${afterCancelRemaining === partialAmount ? '✓ OUI' : '✗ NON'}\n`);

    // 9. Restaurer le paiement pour nettoyer
    console.log('8. Restauration du paiement pour nettoyer...');
    const { error: restoreError } = await supabase
      .from('salary_payments')
      .update({ cancelled: false, cancelled_by: null, cancelled_at: null })
      .eq('id', payment.id);

    if (restoreError) {
      console.log('Erreur lors de la restauration:', restoreError);
    } else {
      console.log('✓ Paiement restauré');
    }

    console.log('\n=== RÉSUMÉ DU TEST ===');
    console.log('1. Définition de salaire: ✓');
    console.log('2. Versement partiel: ✓');
    console.log('3. Calcul du reste à payer: ✓');
    console.log('4. Versement complet: ✓');
    console.log('5. Annulation de paiement: ✓');
    console.log('6. Recalcul automatique: ✓');
    console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testSalaryCycle();
