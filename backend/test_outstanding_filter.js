const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testOutstandingFilter() {
  console.log('=== TEST DU FILTRE PAR MOIS APRÈS NORMALISATION ===\n');

  // Récupérer les impayés sans filtre
  console.log('1. Impayés sans filtre (tous les mois)...');
  const { data: outstandingAll } = await supabase
    .from('salary_payments')
    .select('teacher_id, amount, payment_month')
    .eq('cancelled', false);

  console.log(`Total paiements: ${outstandingAll?.length || 0}`);

  if (outstandingAll && outstandingAll.length > 0) {
    const months = [...new Set(outstandingAll.map(p => p.payment_month))];
    console.log('Mois avec paiements:', months);
  }

  // Récupérer les impayés pour août 2026 (format YYYY-MM-01)
  console.log('\n2. Impayés pour août 2026 (2026-08-01)...');
  const { data: outstandingAug } = await supabase
    .from('salary_payments')
    .select('teacher_id, amount, payment_month')
    .eq('payment_month', '2026-08-01')
    .eq('cancelled', false);

  console.log(`Total paiements août: ${outstandingAug?.length || 0}`);

  // Récupérer les impayés pour septembre 2026
  console.log('\n3. Impayés pour septembre 2026 (2026-09-01)...');
  const { data: outstandingSep } = await supabase
    .from('salary_payments')
    .select('teacher_id, amount, payment_month')
    .eq('payment_month', '2026-09-01')
    .eq('cancelled', false);

  console.log(`Total paiements septembre: ${outstandingSep?.length || 0}`);

  console.log('\n=== CONCLUSION ===');
  if (outstandingAug?.length > 0) {
    console.log('✓ Des paiements existent pour août 2026');
  } else {
    console.log('⚠ Aucun paiement pour août 2026');
  }

  if (outstandingSep?.length > 0) {
    console.log('✓ Des paiements existent pour septembre 2026');
  } else {
    console.log('⚠ Aucun paiement pour septembre 2026');
  }

  console.log('\nLe filtre par mois fonctionne: ' + (outstandingAug?.length === outstandingAll?.length ? '✓ OUI' : '⚠ NON'));
}

testOutstandingFilter();
