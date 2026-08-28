const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStudentsTable() {
  console.log('=== VERIFICATION STRUCTURE TABLE STUDENTS ===\n');

  // Essayer de récupérer un élève pour voir les colonnes
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Colonnes disponibles:');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log('Aucun eleve dans la table');
  }
}

checkStudentsTable();
