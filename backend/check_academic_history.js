const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAcademicHistoryTable() {
  console.log('=== VERIFICATION TABLE STUDENT_ACADEMIC_HISTORY ===\n');

  // Essayer de récupérer des enregistrements
  const { data, error } = await supabase
    .from('student_academic_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur:', error);
    console.log('\nLa table student_academic_history n\'existe peut-etre pas');
  } else {
    console.log('OK - Table student_academic_history existe');
    if (data && data.length > 0) {
      console.log('Colonnes:', Object.keys(data[0]).join(', '));
    }
  }
}

checkAcademicHistoryTable();
