const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function deleteTestPayments() {
  try {
    console.log('=== Suppression des paiements de test ===\n');

    // Supprimer les paiements de scolarité de test
    const { data: tuitionPayments } = await supabase
      .from('tuition_payments')
      .select('id, receipt_number')
      .ilike('receipt_number', 'SCOL-1787548180396%');

    if (tuitionPayments && tuitionPayments.length > 0) {
      console.log(`Suppression de ${tuitionPayments.length} paiements de scolarite de test...`);
      for (const payment of tuitionPayments) {
        const { error } = await supabase
          .from('tuition_payments')
          .delete()
          .eq('id', payment.id);

        if (error) {
          console.error(`Erreur lors de la suppression de ${payment.receipt_number}:`, error);
        } else {
          console.log(`OK Supprime: ${payment.receipt_number}`);
        }
      }
    } else {
      console.log('Aucun paiement de scolarite de test trouve.');
    }

    // Supprimer les paiements de salaires de test
    const { data: salaryPayments } = await supabase
      .from('salary_payments')
      .select('id, receipt_number')
      .ilike('receipt_number', 'SALAIRE-1787548181308%');

    if (salaryPayments && salaryPayments.length > 0) {
      console.log(`\nSuppression de ${salaryPayments.length} paiements de salaires de test...`);
      for (const payment of salaryPayments) {
        const { error } = await supabase
          .from('salary_payments')
          .delete()
          .eq('id', payment.id);

        if (error) {
          console.error(`Erreur lors de la suppression de ${payment.receipt_number}:`, error);
        } else {
          console.log(`OK Supprime: ${payment.receipt_number}`);
        }
      }
    } else {
      console.log('Aucun paiement de salaire de test trouve.');
    }

    // Supprimer le taux de salaire de test
    const { data: salaryRates } = await supabase
      .from('teacher_salaries')
      .select('id, teacher_id')
      .eq('monthly_amount', 100000);

    if (salaryRates && salaryRates.length > 0) {
      console.log(`\nSuppression de ${salaryRates.length} taux de salaires de test...`);
      for (const rate of salaryRates) {
        const { error } = await supabase
          .from('teacher_salaries')
          .delete()
          .eq('id', rate.id);

        if (error) {
          console.error(`Erreur lors de la suppression du taux de salaire:`, error);
        } else {
          console.log(`OK Supprime: taux de salaire pour enseignant ${rate.teacher_id}`);
        }
      }
    } else {
      console.log('Aucun taux de salaire de test trouve.');
    }

    console.log('\n=== Paiements de test supprimes avec succes ===');

  } catch (error) {
    console.error('Erreur lors de la suppression des paiements de test:', error);
  }
}

deleteTestPayments();