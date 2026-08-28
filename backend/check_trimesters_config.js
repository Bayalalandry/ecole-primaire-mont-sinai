const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTrimestersConfig() {
  console.log('=== VERIFICATION CONFIGURATION TRIMESTRES ===\n');

  // Vérifier si la table trimestres existe
  const { data: trimesters, error } = await supabase
    .from('trimesters')
    .select('*')
    .order('trimester_number');

  if (error) {
    console.error('Erreur:', error);
    console.log('\nLa table trimesters n\'existe peut-etre pas');
    console.log('Il faut creer cette table');
  } else {
    console.log('✅ Table trimesters existe');
    console.log(`Total trimestres: ${trimesters.length}`);
    trimesters.forEach(t => {
      console.log(`- T${t.trimester_number}: ${t.start_date} -> ${t.end_date}`);
    });
  }

  // Vérifier aussi dans school_years
  const { data: schoolYears } = await supabase
    .from('school_years')
    .select('*');

  console.log('\n=== ANNEES SCOLAIRES ===');
  console.log(`Total annees: ${schoolYears.length}`);
  schoolYears.forEach(sy => {
    console.log(`- ${sy.year_label}: ${sy.start_date} -> ${sy.end_date} (actuel: ${sy.is_current ? 'OUI' : 'NON'})`);
  });
}

checkTrimestersConfig();
