const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function generateSampleData() {
  try {
    console.log('=== Génération de données pour tests PDF ===\n');

    // 1. Récupérer les élèves
    const { data: students } = await supabase
      .from('students')
      .select(`
        *,
        classes (name)
      `)
      .eq('status', 'active')
      .limit(10);

    console.log('1. DONNÉES ÉLÈVES (pour PDF Élèves):');
    console.log('Nombre d\'élèves actifs:', students?.length || 0);
    students?.forEach(s => {
      console.log(`  - Matricule: ${s.matricule || 'N/A'}`);
      console.log(`    Nom: ${s.last_name || 'N/A'}, Prénom: ${s.first_name || 'N/A'}`);
      console.log(`    Date de naissance: ${s.date_of_birth || 'N/A'}`);
      console.log(`    Genre: ${s.gender || 'N/A'}`);
      console.log(`    Statut: ${s.status || 'N/A'}`);
      console.log(`    Classe: ${s.classes?.name || 'N/A'}`);
      console.log('');
    });

    // 2. Récupérer les paiements de scolarité
    const { data: payments } = await supabase
      .from('tuition_payments')
      .select(`
        *,
        students (last_name, first_name, classes (name)),
        users (last_name, first_name)
      `)
      .limit(5);

    console.log('2. DONNÉES PAIEMENTS SCOLARITÉ (pour PDF Scolarités):');
    console.log('Nombre de paiements:', payments?.length || 0);
    payments?.forEach(p => {
      console.log(`  - Reçu: ${p.receipt_number || 'N/A'}`);
      console.log(`    Élève: ${p.students?.last_name || 'N/A'} ${p.students?.first_name || 'N/A'}`);
      console.log(`    Classe: ${p.students?.classes?.name || 'N/A'}`);
      console.log(`    Montant: ${p.amount || 'N/A'} FCFA`);
      console.log(`    Date paiement: ${p.payment_date || 'N/A'}`);
      console.log(`    Trimestre: ${p.trimester_number ? 'T' + p.trimester_number : 'N/A'}`);
      console.log(`    Année scolaire: ${p.school_year || 'N/A'}`);
      console.log(`    Enregistré par: ${p.users?.last_name || 'N/A'} ${p.users?.first_name || 'N/A'}`);
      console.log('');
    });

    // 3. Récupérer les paiements de salaires
    const { data: salaryPayments } = await supabase
      .from('salary_payments')
      .select(`
        *,
        users (last_name, first_name, role)
      `)
      .limit(5);

    console.log('3. DONNÉES PAIEMENTS SALAIRES (pour PDF Salaires):');
    console.log('Nombre de paiements salaires:', salaryPayments?.length || 0);
    salaryPayments?.forEach(p => {
      const monthName = new Date(p.payment_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const monthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      console.log(`  - Reçu: ${p.receipt_number || 'N/A'}`);
      console.log(`    Enseignant: ${p.users?.last_name || 'N/A'} ${p.users?.first_name || 'N/A'}${p.users?.role === 'director' ? ' (Directeur)' : ''}`);
      console.log(`    Mois concerné: ${monthFormatted}`);
      console.log(`    Montant: ${p.amount || 'N/A'} FCFA`);
      console.log(`    Date paiement: ${p.payment_date || 'N/A'}`);
      console.log(`    Année scolaire: ${p.school_year || 'N/A'}`);
      console.log(`    Enregistré par: ${p.created_by || 'N/A'}`);
      console.log('');
    });

    // 4. Récupérer les dépenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        *,
        users (last_name, first_name)
      `)
      .limit(5);

    console.log('4. DONNÉES DÉPENSES (pour PDF Dépenses):');
    console.log('Nombre de dépenses:', expenses?.length || 0);
    expenses?.forEach(e => {
      console.log(`  - Date: ${e.expense_date || 'N/A'}`);
      console.log(`    Catégorie: ${e.category || 'N/A'}`);
      console.log(`    Description: ${e.description || 'N/A'}`);
      console.log(`    Montant: ${e.amount || 'N/A'} FCFA`);
      console.log(`    Justificatif: ${e.justification_url ? 'Oui' : 'Non'}`);
      console.log(`    Enregistré par: ${e.users?.last_name || 'N/A'} ${e.users?.first_name || 'N/A'}`);
      console.log('');
    });

    console.log('=== FIN DES DONNÉES DE TEST ===');
    console.log('\nCes données peuvent être utilisées pour tester les exports PDF dans l\'interface web.');

  } catch (error) {
    console.error('Erreur lors de la génération des données:', error);
  }
}

generateSampleData();