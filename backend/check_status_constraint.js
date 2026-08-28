const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStatusConstraint() {
  console.log('=== VERIFICATION CONTRAINTE STATUS ===\n');

  // Essayer de mettre un statut 'departed' pour voir l'erreur
  const { data: students } = await supabase
    .from('students')
    .select('id, status')
    .limit(1);

  if (students && students.length > 0) {
    console.log('Statut actuel:', students[0].status);

    // Vérifier les statuts possibles
    const { data: allStudents } = await supabase
      .from('students')
      .select('status');

    const uniqueStatuses = [...new Set(allStudents.map(s => s.status))];
    console.log('\nStatuts existants dans la base:');
    uniqueStatuses.forEach(s => console.log(`- ${s}`));
  }
}

checkStatusConstraint();
