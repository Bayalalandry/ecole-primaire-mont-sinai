const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSalaryValidation() {
  console.log('=== TEST DE VALIDATION DU DÉPASSEMENT ===\n');

  // Nettoyage initial
  console.log('0. Nettoyage des données de test...');
  await supabase.from('teacher_salaries').delete().eq('teacher_id', '0a322338-d85e-492b-9e98-952744e9e4aa');
  await supabase.from('salary_payments').delete().eq('teacher_id', '0a322338-d85e-492b-9e98-952744e9e4aa');
  console.log('✓ Nettoyage terminé\n');

  // Créer un salaire
  console.log('1. Création d\'un salaire de 50 000 XOF...');
  const { data: salary } = await supabase
    .from('teacher_salaries')
    .insert({
      teacher_id: '0a322338-d85e-492b-9e98-952744e9e4aa',
      school_year_id: '5522efee-fa16-4c7f-b611-fcedfde7f373',
      monthly_amount: 50000,
      effective_date: '2026-08-19',
    })
    .select()
    .single();

  console.log(`✓ Salaire créé: ${salary.monthly_amount} XOF\n`);

  // Premier versement
  console.log('2. Premier versement de 30 000 XOF...');
  const receipt1 = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  await supabase.from('salary_payments').insert({
    teacher_id: '0a322338-d85e-492b-9e98-952744e9e4aa',
    salary_id: salary.id,
    amount: 30000,
    payment_month: '2026-08-01',
    payment_date: '2026-08-19',
    receipt_number: receipt1,
    created_by: '64c50d04-d3a3-4044-a9d5-57a7f43fff10',
  });
  console.log('✓ Versement enregistré\n');

  // Tentative de dépassement
  console.log('3. Tentative de versement de 25 000 XOF (dépasserait le salaire)...');
  const receipt2 = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const { data: overPayment, error: overPaymentError } = await supabase
    .from('salary_payments')
    .insert({
      teacher_id: '0a322338-d85e-492b-9e98-952744e9e4aa',
      salary_id: salary.id,
      amount: 25000,
      payment_month: '2026-08-01',
      payment_date: '2026-08-19',
      receipt_number: receipt2,
      created_by: '64c50d04-d3a3-4044-a9d5-57a7f43fff10',
    })
    .select()
    .maybeSingle();

  if (overPaymentError) {
    console.log('✓ VERSEMENT BLOQUÉ PAR LA BASE DE DONNÉES');
    console.log(`  Erreur: ${overPaymentError.message}`);
  } else {
    console.log('⚠ VERSEMENT ACCEPTÉ (validation base de données insuffisante)');
  }

  // Vérifier le solde
  const { data: payments } = await supabase
    .from('salary_payments')
    .select('amount')
    .eq('teacher_id', '0a322338-d85e-492b-9e98-952744e9e4aa')
    .eq('cancelled', false);

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  console.log(`Total versé: ${totalPaid} XOF`);
  console.log(`Statut: ${totalPaid === 50000 ? 'Correct' : 'Erreur'}\n`);

  // Test avec montant exact
  console.log('4. Versement du montant exact restant (20 000 XOF)...');
  const receipt3 = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const { data: exactPayment } = await supabase
    .from('salary_payments')
    .insert({
      teacher_id: '0a322338-d85e-492b-9e98-952744e9e4aa',
      salary_id: salary.id,
      amount: 20000,
      payment_month: '2026-08-01',
      payment_date: '2026-08-19',
      receipt_number: receipt3,
      created_by: '64c50d04-d3a3-4044-a9d5-57a7f43fff10',
    })
    .select()
    .maybeSingle();

  if (exactPayment) {
    console.log('✓ VERSEMENT ACCEPTÉ (montant exact)');
  } else {
    console.log('⚠ VERSEMENT BLOQUÉ (problème de validation)');
  }

  const { data: finalPayments } = await supabase
    .from('salary_payments')
    .select('amount')
    .eq('teacher_id', '0a322338-d85e-492b-9e98-952744e9e4aa')
    .eq('cancelled', false);

  const finalTotal = finalPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  console.log(`Total final: ${finalTotal} XOF`);
  console.log(`Statut: ${finalTotal === 50000 ? 'Correct' : 'Erreur'}\n`);

  // Nettoyage final
  console.log('=== NETTOYAGE FINAL ===');
  await supabase.from('teacher_salaries').delete().eq('teacher_id', '0a322338-d85e-492b-9e98-952744e9e4aa');
  await supabase.from('salary_payments').delete().eq('teacher_id', '0a322338-d85e-492b-9e98-952744e9e4aa');
  console.log('✓ Données de test nettoyées\n');

  console.log('=== RÉSUMÉ ===');
  console.log('Validation du dépassement: ' + (overPaymentError ? '✓ VALIDÉ (bloqué)' : '⚠ PARTIEL (besoin validation API)'));
  console.log('Montant exact accepté: ' + (exactPayment ? '✓ VALIDÉ' : '⚠ ÉCHEC'));
}

testSalaryValidation();
