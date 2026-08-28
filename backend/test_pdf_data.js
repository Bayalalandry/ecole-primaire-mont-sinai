const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testPDFData() {
  try {
    console.log('=== TEST DES DONNEES POUR EXPORTS PDF ===\n');

    // 1. Test des paiements de scolarite
    console.log('1. PAIEMENTS DE SCOLARITE (avec jointures):');
    const { data: tuitionPayments, error: tuitionError } = await supabase
      .from('tuition_payments')
      .select(`
        *,
        students(first_name, last_name, matricule, current_class_id, classes(name)),
        users!tuition_payments_created_by_fkey(first_name, last_name),
        school_years(year_label)
      `)
      .eq('cancelled', false)
      .limit(5);

    if (tuitionError) {
      console.error('Erreur:', tuitionError);
    } else {
      console.log(`Nombre de paiements: ${tuitionPayments?.length || 0}`);
      tuitionPayments?.forEach(p => {
        console.log(`  - Reçu: ${p.receipt_number || 'N/A'}`);
        console.log(`    Élève: ${p.students?.last_name || 'N/A'} ${p.students?.first_name || 'N/A'}`);
        console.log(`    Classe: ${p.students?.classes?.name || 'N/A'}`);
        console.log(`    Montant: ${p.amount || 'N/A'} FCFA`);
        console.log(`    Date: ${p.payment_date || 'N/A'}`);
        console.log(`    Trimestre: ${p.trimester ? 'T' + p.trimester : 'N/A'}`);
        console.log(`    Année scolaire: ${p.school_years?.year_label || 'N/A'}`);
        console.log(`    Enregistré par: ${p.users ? `${p.users.last_name} ${p.users.first_name}` : 'N/A'}`);
        console.log('');
      });
    }

    // 2. Test des paiements de salaires
    console.log('2. PAIEMENTS DE SALAIRES (avec jointures):');
    const { data: salaryPayments, error: salaryError } = await supabase
      .from('salary_payments')
      .select('*')
      .eq('cancelled', false)
      .limit(5);

    if (salaryError) {
      console.error('Erreur:', salaryError);
    } else {
      console.log(`Nombre de paiements: ${salaryPayments?.length || 0}`);
      for (const payment of salaryPayments || []) {
        // Récupérer l'utilisateur (enseignant ou directeur)
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name, username, role')
          .eq('id', payment.teacher_id)
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

        const monthName = new Date(payment.payment_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const monthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        console.log(`  - Reçu: ${payment.receipt_number || 'N/A'}`);
        console.log(`    Enseignant: ${userData ? `${userData.last_name} ${userData.first_name}` : 'N/A'}${userData?.role === 'director' ? ' (Directeur)' : ''}`);
        console.log(`    Mois: ${monthFormatted}`);
        console.log(`    Montant: ${payment.amount || 'N/A'} FCFA`);
        console.log(`    Date: ${payment.payment_date || 'N/A'}`);
        console.log(`    Année scolaire: ${schoolYearData?.year_label || 'N/A'}`);
        console.log(`    Enregistré par: ${createdByData ? `${createdByData.last_name} ${createdByData.first_name}` : 'N/A'}`);
        console.log('');
      }
    }

    // 3. Test des dépenses
    console.log('3. DEPENSES (avec jointures):');
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('*, users(first_name, last_name)')
      .limit(5);

    if (expenseError) {
      console.error('Erreur:', expenseError);
    } else {
      console.log(`Nombre de dépenses: ${expenses?.length || 0}`);
      expenses?.forEach(e => {
        console.log(`  - Date: ${e.expense_date || 'N/A'}`);
        console.log(`    Catégorie: ${e.category || 'N/A'}`);
        console.log(`    Description: ${e.description || 'N/A'}`);
        console.log(`    Montant: ${e.amount || 'N/A'} FCFA`);
        console.log(`    Justificatif: ${e.receipt_url ? 'Oui' : 'Non'}`);
        console.log(`    Enregistré par: ${e.users ? `${e.users.last_name} ${e.users.first_name}` : 'N/A'}`);
        console.log('');
      });
    }

    // 4. Test du formatage des montants
    console.log('4. TEST DU FORMATAGE DES MONTANTS:');
    const testAmounts = [50000, 3000, 3900, 100000, 1500000];
    testAmounts.forEach(amount => {
      const rounded = Math.round(amount);
      const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
      console.log(`  ${amount} -> ${formatted}`);
    });

    console.log('\n=== FIN DES TESTS ===');
    console.log('Les serveurs sont prets. Vous pouvez tester les exports PDF dans l\'interface web.');
    console.log('Backend: http://localhost:5000');
    console.log('Frontend: http://localhost:5173');

  } catch (error) {
    console.error('Erreur lors des tests:', error);
  }
}

testPDFData();