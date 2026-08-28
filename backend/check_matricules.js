const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkMatricules() {
  console.log('=== Vérification des matricules existants ===\n');
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('matricule, first_name, last_name')
      .order('matricule');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    if (!students || students.length === 0) {
      console.log('Aucun élève trouvé');
      return;
    }
    
    console.log(`${students.length} élève(s) trouvé(s):`);
    students.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.matricule} - ${s.first_name} ${s.last_name}`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkMatricules().then(() => process.exit(0));