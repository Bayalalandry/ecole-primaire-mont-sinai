const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAcademicHistorySchema() {
  console.log('=== VERIFICATION SCÉMA STUDENT_ACADEMIC_HISTORY ===\n');

  // Essayer de récupérer un enregistrement pour voir les colonnes
  const { data, error } = await supabase
    .from('student_academic_history')
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
    console.log('Aucun enregistrement dans la table');
  }
}

checkAcademicHistorySchema();
