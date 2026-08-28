const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkUniqueIdentifiers() {
  console.log('=== Vérification des unique_identifiers existants ===\n');
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('unique_identifier, matricule, first_name, last_name')
      .order('unique_identifier');
    
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
      console.log(`  ${i + 1}. ${s.unique_identifier} - ${s.matricule} - ${s.first_name} ${s.last_name}`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkUniqueIdentifiers().then(() => process.exit(0));