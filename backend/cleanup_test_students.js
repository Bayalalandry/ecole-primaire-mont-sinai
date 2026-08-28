const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupTestStudents() {
  console.log('=== Nettoyage des élèves de test ===\n');
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .ilike('last_name', '%Test%');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    if (!students || students.length === 0) {
      console.log('Aucun élève de test trouvé');
      return;
    }
    
    console.log(`${students.length} élève(s) de test trouvé(s):`);
    students.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.first_name} ${s.last_name} (${s.matricule})`);
    });
    
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .ilike('last_name', '%Test%');
    
    if (deleteError) {
      console.log('Erreur lors de la suppression:', deleteError.message);
      return;
    }
    
    console.log('\n✅ Élèves de test supprimés');
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

cleanupTestStudents().then(() => process.exit(0));