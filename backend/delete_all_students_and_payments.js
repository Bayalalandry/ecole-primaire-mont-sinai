const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllStudentsAndPayments() {
  console.log('=== SUPPRESSION DE TOUS LES ÉLÈVES ET PAIEMENTS ===\n');

  try {
    // 1. Supprimer tous les paiements de scolarité
    console.log('1. Suppression des paiements de scolarité...');
    const { error: paymentsError } = await supabase
      .from('tuition_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Tous les enregistrements

    if (paymentsError) {
      console.error('Erreur lors de la suppression des paiements:', paymentsError);
    } else {
      console.log('✓ Paiements de scolarité supprimés');
    }

    // 2. Supprimer tous les élèves
    console.log('\n2. Suppression des élèves...');
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Tous les enregistrements

    if (studentsError) {
      console.error('Erreur lors de la suppression des élèves:', studentsError);
    } else {
      console.log('✓ Élèves supprimés');
    }

    console.log('\n=== SUPPRESSION TERMINÉE ===');
    console.log('Tous les élèves et paiements ont été supprimés.');
    console.log('Vous pouvez maintenant importer la nouvelle liste.');

  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

deleteAllStudentsAndPayments();
