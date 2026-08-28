const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDirectorSalary() {
  console.log('=== TEST SALAIRE DIRECTEUR ===\n');

  // Récupérer le directeur
  const { data: director } = await supabase
    .from('users')
    .select('id, first_name, last_name, username, role')
    .eq('role', 'director')
    .maybeSingle();

  if (!director) {
    console.log('Aucun directeur trouvé');
    return;
  }

  console.log(`Directeur: ${director.last_name} ${director.first_name} (${director.username})`);
  console.log(`ID: ${director.id}\n`);

  // Nettoyer les données de test
  await supabase.from('teacher_salaries').delete().eq('teacher_id', director.id);
  await supabase.from('salary_payments').delete().eq('teacher_id', director.id);

  // Créer un salaire pour le directeur
  console.log('1. Création d\'un salaire pour le directeur...');
  const { data: schoolYearData } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', '2026-2027')
    .maybeSingle();

  const { data: salary } = await supabase
    .from('teacher_salaries')
    .insert({
      teacher_id: director.id,
      school_year_id: schoolYearData?.id,
      monthly_amount: 300000,
      effective_date: '2026-08-19',
    })
    .select()
    .single();

  console.log(`✓ Salaire créé: ${salary.monthly_amount} XOF\n`);

  // Enregistrer un paiement
  console.log('2. Enregistrement d\'un paiement...');
  const receiptNumber = `SAL${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const { data: payment } = await supabase
    .from('salary_payments')
    .insert({
      teacher_id: director.id,
      salary_id: salary.id,
      amount: 150000,
      payment_month: '2026-08-01',
      payment_date: '2026-08-19',
      receipt_number: receiptNumber,
      created_by: '64c50d04-d3a3-4044-a9d5-57a7f43fff10',
      school_year_id: schoolYearData?.id,
    })
    .select()
    .single();

  console.log(`✓ Paiement enregistré: ${payment.amount} XOF`);
  console.log(`Numéro de reçu: ${payment.receipt_number}\n`);

  // Vérifier le bulletin
  console.log('3. Données du bulletin:');
  console.log(`  - Enseignant: ${director.last_name} ${director.first_name} (Directeur)`);
  console.log(`  - Mois: Août 2026`);
  console.log(`  - Montant: ${payment.amount} XOF`);
  console.log(`  - Date: ${payment.payment_date}`);
  console.log(`  - Reçu: ${payment.receipt_number}\n`);

  // Nettoyer
  await supabase.from('teacher_salaries').delete().eq('teacher_id', director.id);
  await supabase.from('salary_payments').delete().eq('teacher_id', director.id);

  console.log('✓ Données de test nettoyées');
  console.log('\n=== TEST TERMINÉ ===');
}

testDirectorSalary();
