const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function normalizePaymentMonths() {
  console.log('=== NORMALISATION DES PAYMENT_MONTH ===\n');

  // Récupérer tous les paiements
  const { data: payments, error } = await supabase
    .from('salary_payments')
    .select('id, payment_month');

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log(`Total paiements: ${payments.length}`);

  // Normaliser chaque payment_month
  for (const payment of payments) {
    const currentMonth = payment.payment_month;
    const normalizedMonth = currentMonth.substring(0, 7) + '-01'; // "2026-08-19" -> "2026-08-01"

    if (currentMonth !== normalizedMonth) {
      console.log(`Normalisation: ${currentMonth} -> ${normalizedMonth}`);

      const { error: updateError } = await supabase
        .from('salary_payments')
        .update({ payment_month: normalizedMonth })
        .eq('id', payment.id);

      if (updateError) {
        console.error(`Erreur pour paiement ${payment.id}:`, updateError);
      } else {
        console.log(`✓ Paiement ${payment.id} mis à jour`);
      }
    } else {
      console.log(`✓ Paiement ${payment.id} déjà au bon format: ${normalizedMonth}`);
    }
  }

  console.log('\n=== VÉRIFICATION ===');
  const { data: verifyPayments } = await supabase
    .from('salary_payments')
    .select('payment_month');

  const months = [...new Set(verifyPayments.map(p => p.payment_month))];
  console.log('Mois après normalisation:', months);
}

normalizePaymentMonths();
