const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkPaymentsIntegrity() {
  try {
    console.log('=== VERIFICATION DE L\'INTEGRITE DES PAIEMENTS ===\n');

    // 1. Verifier TOUS les paiements de scolarite dans la base
    console.log('1. TOUS LES PAIEMENTS DE SCOLARITE dans la base:');
    const { data: allTuitionPayments, error: tuitionError } = await supabase
      .from('tuition_payments')
      .select(`
        id,
        receipt_number,
        amount,
        payment_date,
        cancelled,
        students(last_name, first_name)
      `)
      .order('payment_date', { ascending: false });

    if (tuitionError) {
      console.error('Erreur:', tuitionError);
    } else {
      console.log(`Nombre total de paiements: ${allTuitionPayments?.length || 0}`);
      allTuitionPayments?.forEach(p => {
        console.log(`  - Reçu: ${p.receipt_number || 'N/A'}`);
        console.log(`    Élève: ${p.students?.last_name || 'N/A'} ${p.students?.first_name || 'N/A'}`);
        console.log(`    Montant: ${p.amount || 'N/A'} FCFA`);
        console.log(`    Date: ${p.payment_date || 'N/A'}`);
        console.log(`    Annulé: ${p.cancelled ? 'Oui' : 'Non'}`);
        console.log(`    ID: ${p.id}`);
        console.log('');
      });
    }

    // 2. Chercher specifiquement les paiements pour landry steve et sam steve
    console.log('2. RECHERCHE SPECIFIQUE pour landry steve et sam steve:');
    const { data: specificStudents } = await supabase
      .from('students')
      .select('id, last_name, first_name')
      .or('last_name.ilike.%steve%');

    console.log('Élèves avec "steve" dans le nom:');
    specificStudents?.forEach(s => {
      console.log(`  - ${s.last_name} ${s.first_name} (ID: ${s.id})`);
    });

    if (specificStudents && specificStudents.length > 0) {
      const studentIds = specificStudents.map(s => s.id);
      const { data: stevePayments } = await supabase
        .from('tuition_payments')
        .select(`
          id,
          receipt_number,
          amount,
          payment_date,
          cancelled,
          students(last_name, first_name)
        `)
        .in('student_id', studentIds)
        .order('payment_date', { ascending: false });

      console.log(`\nPaiements pour ces élèves: ${stevePayments?.length || 0}`);
      stevePayments?.forEach(p => {
        console.log(`  - ${p.students?.last_name} ${p.students?.first_name}: ${p.amount} FCFA (${p.receipt_number})`);
      });
    }

    // 3. Verifier la depense du 21/08/2026
    console.log('\n3. VERIFICATION DE LA DEPENSE DU 21/08/2026:');
    const { data: expenseCheck } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_date', '2026-08-21');

    if (expenseCheck && expenseCheck.length > 0) {
      console.log('Dépense trouvée:');
      expenseCheck.forEach(e => {
        console.log(`  - ID: ${e.id}`);
        console.log(`    Date: ${e.expense_date}`);
        console.log(`    Catégorie: ${e.category}`);
        console.log(`    Description: "${e.description}"`);
        console.log(`    Montant: ${e.amount} FCFA`);
        console.log(`    Justificatif: ${e.receipt_url ? 'Oui' : 'Non'}`);
      });
    } else {
      console.log('Aucune dépense trouvée pour le 21/08/2026');
    }

    // 4. Verifier s'il y a des depenses sans description
    console.log('\n4. DEPENSES SANS DESCRIPTION:');
    const { data: emptyDescriptionExpenses } = await supabase
      .from('expenses')
      .select('*')
      .or('description.is.null,description.eq.\\N/A,description.eq.');

    console.log(`Nombre de dépenses sans description: ${emptyDescriptionExpenses?.length || 0}`);
    emptyDescriptionExpenses?.forEach(e => {
      console.log(`  - ${e.expense_date} - ${e.category} - ${e.amount} FCFA (description: "${e.description}")`);
    });

    console.log('\n=== FIN DE LA VERIFICATION ===');

  } catch (error) {
    console.error('Erreur lors de la verification:', error);
  }
}

checkPaymentsIntegrity();